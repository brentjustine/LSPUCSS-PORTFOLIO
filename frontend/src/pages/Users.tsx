import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis
} from 'recharts';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const query = useQuery();

const location = useLocation();

    useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const q = searchParams.get("q") || "";
    setSearch(q);
    }, [location.search]);


  useEffect(() => {
    (async () => {
      const [{ data: userData }, { data: projectData }, { data: sessionData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('is_public', true),
        supabase.from('projects').select('*'),
        supabase.auth.getSession(),
      ]);

      if (sessionData?.session?.user?.id) {
        setCurrentUserId(sessionData.session.user.id);
      }

      if (userData) setUsers(userData);
      if (projectData) setProjects(projectData);
    })();
  }, []);

  const COLORS = ["#3b82f6", "#e5e7eb"];

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUserId &&
      (u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const getUserProjects = (userId: string) =>
    projects.filter((p) => p.user_id === userId);

  const getUserScoreData = (userId: string) => {
    const userProjects = getUserProjects(userId);
    const average =
      userProjects.length > 0
        ? userProjects.reduce((acc, p) => acc + (p.ai_score || 0), 0) / userProjects.length
        : 0;
    return [
      { name: 'Score', value: average },
      { name: 'Remaining', value: 10 - average }
    ];
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      <h2 className="text-2xl font-bold mb-4">👥 Public Student Portfolios</h2>

      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
        className="mb-6 px-4 py-2 w-full border rounded shadow-sm"
      />

      <div className="space-y-8">
        {filteredUsers.map((u) => {
          const userProjects = getUserProjects(u.id);
          const pieData = getUserScoreData(u.id);

          return (
            <div key={u.id} className="bg-white p-4 rounded-xl shadow-md space-y-4">
              <div className="flex items-center gap-4">
                <img
                    src={
                        (u.profile_picture_url
                        ? `${u.profile_picture_url}?t=${new Date(u.updated_at).getTime()}`
                        : 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png')
                    }
                    alt="avatar"
                    className="w-16 h-16 rounded-full object-cover"
                    />
                <div>
                  <Link
                    to={`/user/${u.id}`}
                    className="text-xl font-bold text-blue-600 hover:underline"
                  >
                    {u.full_name}
                  </Link>
                  <p className="text-gray-500 text-sm">{u.bio || 'No bio available'}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <PieChart width={200} height={200}>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </div>

                <div className="min-h-[200px]">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={userProjects.map((p) => ({ name: p.title, score: p.ai_score ?? 0 }))}
                      margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
