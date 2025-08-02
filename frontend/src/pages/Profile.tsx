import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setProfilePicUrl(user.user_metadata?.profile_pic || '');
        setBio(user.user_metadata?.bio || '');
      }
      setLoading(false);
    })();
  }, []);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const toastId = toast.loading("Updating profile...");
    let uploadedImageUrl = profilePicUrl;

    try {
      if (file && user) {
        if (profilePicUrl && user) {
          const ext = profilePicUrl.split('.').pop()?.split('?')[0]; // handles ?t= cache busting
          const oldPath = `avatars/${user.id}.${ext}`;
          await supabase.storage.from('avatars').remove([oldPath]);
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `avatars/${user.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          toast.error('Image upload failed: ' + uploadError.message, { id: toastId });
          return;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        uploadedImageUrl = data.publicUrl;
      }

      // 👇 Update auth user metadata
      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: {
          profile_pic: uploadedImageUrl,
          bio: bio,
        },
      });

      if (updateAuthError) {
        toast.error('Failed to update profile: ' + updateAuthError.message, { id: toastId });
        return;
      }

      // 👇 Now also update the `profiles` table to sync for /users page
      const { error: updateDbError } = await supabase.from('profiles').update({
        profile_picture_url: uploadedImageUrl,
        bio: bio,
      }).eq('id', user.id);

      if (updateDbError) {
        toast.error('DB profile update failed: ' + updateDbError.message, { id: toastId });
        return;
      }

      setProfilePicUrl(uploadedImageUrl);
      setFile(null);
      setPreview(null);
      toast.success('Profile updated!', { id: toastId });

    } catch (err: any) {
      toast.error('Something went wrong: ' + err.message, { id: toastId });
    }
  };


  if (loading) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded-xl shadow-lg space-y-6">
      <h2 className="text-2xl font-bold text-center">👤 Your Profile</h2>

      <div className="space-y-4 text-center">
        <p><strong>Full Name:</strong> {user.user_metadata?.full_name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        {profilePicUrl && !preview && (
          <img
            src={profilePicUrl}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border mx-auto"
          />
        )}
        {preview && (
          <img
            src={preview}
            alt="New Profile Preview"
            className="w-24 h-24 rounded-full object-cover border mx-auto"
          />
        )}
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => dropRef.current?.querySelector('input')?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition"
        >
          <p className="text-gray-600 mb-2">Drag and drop your image here</p>
          <p className="text-sm text-gray-500">or click to browse</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <textarea
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Your bio..."
          className="w-full p-3 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
