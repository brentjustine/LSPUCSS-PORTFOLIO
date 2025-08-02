// === src/pages/UserDetail.tsx ===
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import ProjectCard from './Projects';

export default function UserDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .single();

      if (profileError || !profile) {
        setError('This user profile is private or does not exist.');
        return;
      }

      setProfile(profile);

      const { data: userProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', id);

      setProjects(userProjects || []);
    };

    fetchData();
  }, [id]);

  if (error) return <p className="text-center mt-20 text-red-500">{error}</p>;
  if (!profile) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow text-center">
        <img
          src={profile.profile_picture_url || 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png'}
          alt="avatar"
          className="w-24 h-24 mx-auto rounded-full object-cover"
        />
        <h2 className="text-2xl font-bold mt-2">{profile.full_name}</h2>
        <p className="text-gray-600 text-sm">{profile.email}</p>
        <p className="mt-2 text-gray-700">{profile.bio || 'No bio.'}</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">📁 Projects</h3>
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              description={project.description}
              ai_score={project.ai_score}
            />
          ))
        ) : (
          <p className="text-gray-500 text-sm">No projects uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
