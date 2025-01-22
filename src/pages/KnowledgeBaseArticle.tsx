import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  ChevronLeft,
  Edit,
  Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Article {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'pending_review' | 'published';
  created_at: string;
  updated_at: string;
  category: {
    name: string;
  };
  author: {
    full_name: string;
  };
}

interface UserProfile {
  role: 'client' | 'agent' | 'manager';
}

function KnowledgeBaseArticle() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
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

    const fetchArticle = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('knowledge_base')
        .select(`
          *,
          category:categories(name),
          author:users(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        toast.error('Failed to load article');
        navigate('/knowledge-base');
        return;
      }

      setArticle(data);
      setLoading(false);
    };

    fetchUserProfile();
    fetchArticle();
  }, [id, user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/knowledge-base')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Knowledge Base
        </button>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{article.title}</h1>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>
                  By {article.author.full_name} · {article.category.name} ·{' '}
                  {new Date(article.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            {(userProfile?.role === 'agent' || userProfile?.role === 'manager') && (
              <Link
                to={`/knowledge-base/${article.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Article
              </Link>
            )}
          </div>

          <div className="mt-6 prose prose-indigo max-w-none">
            <div className="whitespace-pre-wrap">{article.content}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeBaseArticle;