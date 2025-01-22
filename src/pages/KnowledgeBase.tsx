import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  Book,
  Search,
  Plus,
  ChevronRight,
  Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Article {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'pending_review' | 'published';
  created_at: string;
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

function KnowledgeBase() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

    const fetchArticles = async () => {
      const query = supabase
        .from('knowledge_base')
        .select(`
          *,
          category:categories(name),
          author:users(full_name)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setArticles(data);
      }

      setLoading(false);
    };

    fetchUserProfile();
    fetchArticles();
  }, [user, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Knowledge Base
          </h2>
        </div>
        {(userProfile?.role === 'agent' || userProfile?.role === 'manager') && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/knowledge-base/new"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Article
            </Link>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search articles..."
            />
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {articles.map((article) => (
              <li key={article.id}>
                <Link
                  to={`/knowledge-base/${article.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Book className="h-5 w-5 text-gray-400 mr-3" />
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {article.title}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {article.category.name}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          By {article.author.full_name} ·{' '}
                          {new Date(article.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeBase;