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

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <p className="text-center text-red-600 text-lg font-medium bg-white p-6 rounded shadow">
          {error}
        </p>
      </div>
    );

  if (!profile)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 px-4 py-10">
      <div className="w-full max-w-4xl space-y-8">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <img
            src={
              profile.profile_picture_url ||
              'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png'
            }
            alt="avatar"
            className="w-24 h-24 mx-auto rounded-full object-cover border"
          />
          <h2 className="text-2xl font-bold mt-3 text-gray-800">{profile.full_name}</h2>
          <p className="text-gray-600 text-sm">{profile.email}</p>
          {profile.course && (
            <p className="text-gray-500 text-sm mt-1">📘 {profile.course}</p>
          )}
          <p className="mt-2 text-gray-700 text-sm">
            {profile.bio || 'No bio provided.'}
          </p>
        </div>
        {/* Projects Section */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h3 className="text-xl font-bold text-gray-800 border-b pb-2">📁 Public Projects</h3>
          {projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  title={project.title}
                  description={project.description}
                  ai_score={project.ai_score}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No public projects available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
