import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) alert(error.message);
    else alert('✅ Success!');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">{isLogin ? 'Login' : 'Register'}</h1>
      <input
        className="w-full p-2 border rounded mb-2"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        className="w-full p-2 border rounded mb-2"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button className="w-full bg-blue-500 text-white py-2 rounded">
        {isLogin ? 'Login' : 'Register'}
      </button>
      <p className="mt-2 text-center text-sm">
        {isLogin ? 'Need an account?' : 'Already have one?'}{' '}
        <span onClick={() => setIsLogin(!isLogin)} className="text-blue-600 cursor-pointer underline">
          {isLogin ? 'Register' : 'Login'}
        </span>
      </p>
    </form>
  );
}
