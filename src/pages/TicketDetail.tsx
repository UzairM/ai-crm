import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  MessageSquare,
  Loader,
  ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  category: {
    name: string;
  };
  created_by: {
    full_name: string;
  };
  assigned_to?: {
    full_name: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  internal_note: boolean;
  created_by: {
    full_name: string;
  };
}

interface UserProfile {
  role: 'client' | 'agent' | 'manager';
}

function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    };

    const fetchTicket = async () => {
      if (!id) return;

      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          category:categories(name),
          created_by:users!tickets_created_by_fkey(full_name),
          assigned_to:users!tickets_assigned_to_fkey(full_name)
        `)
        .eq('id', id)
        .single();

      if (ticketError) {
        toast.error('Failed to load ticket');
        navigate('/tickets');
        return;
      }

      setTicket(ticketData);

      const { data: commentsData, error: commentsError } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          created_by:users(full_name)
        `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (!commentsError && commentsData) {
        setComments(commentsData);
      }

      setLoading(false);
    };

    fetchUserProfile();
    fetchTicket();
  }, [id, user, navigate]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', ticket.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      setTicket({ ...ticket, status: newStatus as Ticket['status'] });
      toast.success('Status updated successfully');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticket) return;

    try {
      const { error } = await supabase.from('ticket_comments').insert([
        {
          ticket_id: ticket.id,
          content: newComment,
          internal_note: isInternalNote,
          created_by: user.id,
        },
      ]);

      if (error) throw error;

      // Refresh comments
      const { data: newComments } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          created_by:users(full_name)
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (newComments) {
        setComments(newComments);
      }

      setNewComment('');
      setIsInternalNote(false);
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!ticket) {
    return <div>Ticket not found</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/tickets')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to tickets
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {ticket.subject}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Ticket #{ticket.id.slice(0, 8)}
              </p>
            </div>
            {(userProfile?.role === 'agent' || userProfile?.role === 'manager') && (
              <div className="flex space-x-3">
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                {getStatusIcon(ticket.status)}
                <span className="ml-2">
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                    ticket.priority
                  )}`}
                >
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created by</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {ticket.created_by.full_name}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900">{ticket.category.name}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {ticket.description}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Comments
            </h3>

            <div className="space-y-6 mb-6">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`bg-gray-50 rounded-lg p-4 ${
                    comment.internal_note ? 'border-l-4 border-yellow-400' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">
                          {comment.created_by.full_name}
                        </span>
                        {comment.internal_note && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Internal Note
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleCommentSubmit}>
              <div>
                <label htmlFor="comment" className="sr-only">
                  Add comment
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
              </div>
              {(userProfile?.role === 'agent' || userProfile?.role === 'manager') && (
                <div className="mt-3">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="internal_note"
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="internal_note"
                        className="font-medium text-gray-700"
                      >
                        Internal note
                      </label>
                      <p className="text-gray-500">
                        Only visible to support staff
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetail;