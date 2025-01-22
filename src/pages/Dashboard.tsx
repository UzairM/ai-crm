import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
  TicketPlus,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp,
  BarChart3,
  Timer,
  Loader,
  Book,
} from 'lucide-react';

interface DashboardStats {
  openTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  urgentTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  ticketsByCategory: {
    category: string;
    count: number;
  }[];
  ticketsByAgent: {
    agent: string;
    count: number;
    resolved: number;
  }[];
}

interface UserProfile {
  role: 'client' | 'agent' | 'manager';
  full_name: string;
}

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    openTickets: 0,
    resolvedTickets: 0,
    pendingTickets: 0,
    urgentTickets: 0,
    avgResponseTime: 0,
    avgResolutionTime: 0,
    ticketsByCategory: [],
    ticketsByAgent: [],
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7'); // days

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    };

    const fetchStats = async () => {
      if (!user) return;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      // Fetch basic ticket statistics
      const { data: ticketStats, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          status,
          priority,
          category:categories(name),
          assigned_to:users!tickets_assigned_to_fkey(full_name),
          created_at,
          updated_at
        `)
        .gte('created_at', startDate.toISOString());

      if (!ticketError && ticketStats) {
        // Calculate basic stats
        const openCount = ticketStats.filter((t) => t.status === 'open').length;
        const resolvedCount = ticketStats.filter((t) => t.status === 'resolved').length;
        const pendingCount = ticketStats.filter((t) => t.status === 'pending').length;
        const urgentCount = ticketStats.filter((t) => t.priority === 'urgent').length;

        // Calculate category distribution
        const categoryCount = ticketStats.reduce((acc, ticket) => {
          const category = ticket.category?.name || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const ticketsByCategory = Object.entries(categoryCount).map(([category, count]) => ({
          category,
          count,
        }));

        // Calculate agent performance
        const agentPerformance = ticketStats.reduce((acc, ticket) => {
          if (ticket.assigned_to?.full_name) {
            const agent = ticket.assigned_to.full_name;
            if (!acc[agent]) {
              acc[agent] = { count: 0, resolved: 0 };
            }
            acc[agent].count++;
            if (ticket.status === 'resolved') {
              acc[agent].resolved++;
            }
          }
          return acc;
        }, {} as Record<string, { count: number; resolved: number }>);

        const ticketsByAgent = Object.entries(agentPerformance).map(([agent, stats]) => ({
          agent,
          count: stats.count,
          resolved: stats.resolved,
        }));

        // Calculate average response and resolution times
        const resolvedTickets = ticketStats.filter((t) => t.status === 'resolved');
        const avgResolutionTime = resolvedTickets.length
          ? resolvedTickets.reduce((acc, ticket) => {
              const created = new Date(ticket.created_at);
              const resolved = new Date(ticket.updated_at);
              return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
            }, 0) / resolvedTickets.length
          : 0;

        setStats({
          openTickets: openCount,
          resolvedTickets: resolvedCount,
          pendingTickets: pendingCount,
          urgentTickets: urgentCount,
          avgResponseTime: 0, // This would require comment data to calculate first response time
          avgResolutionTime,
          ticketsByCategory,
          ticketsByAgent,
        });
      }

      setLoading(false);
    };

    fetchUserProfile();
    fetchStats();
  }, [user, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {userProfile?.full_name}!
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Here's an overview of your support system
            </p>
          </div>
          {userProfile?.role === 'manager' && (
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="ml-4 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TicketPlus className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Open Tickets
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.openTickets}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Tickets
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.pendingTickets}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Resolved Tickets
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.resolvedTickets}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Urgent Tickets
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.urgentTickets}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {userProfile?.role === 'manager' && (
        <>
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Tickets by Category
                  </h3>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {stats.ticketsByCategory.map((category) => (
                    <div key={category.category}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{category.category}</span>
                        <span className="font-medium">{category.count}</span>
                      </div>
                      <div className="mt-1 relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                          <div
                            style={{
                              width: `${(category.count /
                                Math.max(
                                  ...stats.ticketsByCategory.map((c) => c.count)
                                )) *
                                100}%`,
                            }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Agent Performance
                  </h3>
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {stats.ticketsByAgent.map((agent) => (
                    <div key={agent.agent}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{agent.agent}</span>
                        <span className="font-medium">
                          {agent.resolved}/{agent.count} resolved
                        </span>
                      </div>
                      <div className="mt-1 relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                          <div
                            style={{
                              width: `${(agent.resolved / agent.count) * 100}%`,
                            }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Average Resolution Time
                  </h3>
                  <Timer className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.avgResolutionTime.toFixed(1)} hours
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Average time to resolve tickets
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Resolution Rate
                  </h3>
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.resolvedTickets > 0
                    ? (
                        (stats.resolvedTickets /
                          (stats.openTickets +
                            stats.pendingTickets +
                            stats.resolvedTickets)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Percentage of tickets resolved
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            to="/tickets/new"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
          >
            <div className="flex-shrink-0">
              <TicketPlus className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">Create New Ticket</p>
              <p className="text-sm text-gray-500">Submit a new support request</p>
            </div>
          </Link>

          <Link
            to="/knowledge-base"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
          >
            <div className="flex-shrink-0">
              <Book className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">Knowledge Base</p>
              <p className="text-sm text-gray-500">Find answers to common questions</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;