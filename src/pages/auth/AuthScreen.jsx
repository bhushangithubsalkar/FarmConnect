import { useState } from 'react';
import { 
  Tractor, User, Mail, Lock, Image as ImageIcon, 
  Eye, EyeOff, X, ShieldCheck, AlertCircle, Loader2, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthScreen({ onNavigate }) {
  const { login, register } = useAuth();

  const [authMode, setAuthMode] = useState('register'); // 'register' or 'login'
  const [role, setRole] = useState('farmer'); // 'customer' or 'farmer'
  
  // Controlled form state
  const [name, setName] = useState('Ramesh Patel');
  const [phone, setPhone] = useState('(555) 234-5678');
  const [email, setEmail] = useState('ramesh.patel@farmconnect.com');
  const [password, setPassword] = useState('FarmerPass123!');
  const [showPassword, setShowPassword] = useState(false);
  
  // Farmland file upload for farmers
  const [farmlandFile, setFarmlandFile] = useState(null);
  const [farmlandPreview, setFarmlandPreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Calculate password strength
  const calculateStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9!@#$%^&*]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-emerald-600' };
      case 4:
      default:
        return { score: 4, label: 'Strong', color: 'bg-emerald-700' };
    }
  };

  const strength = calculateStrength(password);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Farmland image must be under 10MB');
        return;
      }
      setFarmlandFile(file);
      setFarmlandPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setFarmlandFile(null);
    if (farmlandPreview) {
      URL.revokeObjectURL(farmlandPreview);
      setFarmlandPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (authMode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!email.trim()) throw new Error('Please enter your email address');
        if (password.length < 6) throw new Error('Password must be at least 6 characters long');
        
        const { profile } = await register({
          email,
          password,
          name,
          phone,
          role,
          farmlandFile
        });

        setSuccess('Account created successfully!');
        const targetRole = profile?.role || role;
        setTimeout(() => {
          if (targetRole === 'admin') onNavigate('admin');
          else if (targetRole === 'farmer') onNavigate('farmer');
          else onNavigate('market');
        }, 600);

      } else {
        // Sign In
        if (!email.trim() || !password) throw new Error('Please enter both email and password');
        
        const { profile } = await login(email, password);
        setSuccess('Signed in successfully!');
        
        const userRole = profile?.role || 'customer';
        setTimeout(() => {
          if (userRole === 'admin') onNavigate('admin');
          else if (userRole === 'farmer') onNavigate('farmer');
          else onNavigate('market');
        }, 600);
      }
    } catch (err) {
      console.error("Auth error:", err);
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already in use. Please sign in instead.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Email/password authentication is disabled for this Firebase project. Enable Email/Password in Firebase Console under Authentication > Sign-in method.';
      } else if (err.code === 'auth/api-key-not-valid' || msg.includes('API key')) {
        msg = 'Firebase API key is not configured in .env. You can use the demo links below to inspect all portals!';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4fbf7] flex flex-col items-center justify-center p-4 font-sans text-gray-800">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center bg-white p-3 rounded-2xl shadow-sm border border-emerald-100 relative mb-2">
          <Tractor className="h-8 w-8 text-emerald-600" />
          <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-emerald-600 rounded-full"></span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Farm<span className="text-emerald-700">Connect</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">Direct from harvest to your home</p>
      </div>

      <div className="w-full max-w-md bg-[#e6f4ed] p-1.5 rounded-full flex mb-6 shadow-inner">
        <button 
          type="button"
          onClick={() => { setAuthMode('login'); setError(null); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition ${authMode === 'login' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Sign In
        </button>
        <button 
          type="button"
          onClick={() => { setAuthMode('register'); setError(null); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition ${authMode === 'register' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Register
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 border border-emerald-100 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-2">Select Your Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => setRole('customer')}
                  className={`cursor-pointer p-4 rounded-2xl border transition flex flex-col justify-between ${role === 'customer' ? 'border-emerald-600 bg-[#f4fbf7]' : 'border-gray-200 bg-[#fafafa]'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="p-2 bg-white rounded-xl shadow-xs"><User className="h-5 w-5 text-emerald-700" /></span>
                    {role === 'customer' && <span className="h-5 w-5 bg-emerald-700 text-white rounded-full flex items-center justify-center text-xs">✓</span>}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Customer</h3>
                    <p className="text-[11px] text-gray-500">Buy farm fresh</p>
                  </div>
                </div>

                <div 
                  onClick={() => setRole('farmer')}
                  className={`cursor-pointer p-4 rounded-2xl border transition flex flex-col justify-between ${role === 'farmer' ? 'border-emerald-600 bg-[#f4fbf7]' : 'border-gray-200 bg-[#fafafa]'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="p-2 bg-white rounded-xl shadow-xs"><Tractor className="h-5 w-5 text-emerald-700" /></span>
                    {role === 'farmer' && <span className="h-5 w-5 bg-emerald-700 text-white rounded-full flex items-center justify-center text-xs">✓</span>}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Farmer</h3>
                    <p className="text-[11px] text-gray-500">Sell direct harvest</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {authMode === 'register' && (
            <>
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User className="h-4 w-4 text-gray-400" /></span>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh Patel" 
                    className="w-full pl-10 pr-4 py-3 bg-[#f7fcf9] border border-emerald-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1">Phone Number</label>
                <div className="relative flex">
                  <div className="flex items-center pl-3 pr-2 bg-[#f7fcf9] border border-r-0 border-emerald-100 rounded-l-2xl text-sm text-gray-600">
                    <span>+91</span>
                  </div>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210" 
                    className="w-full pl-3 pr-4 py-3 bg-[#f7fcf9] border border-emerald-100 rounded-r-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" 
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-gray-400" /></span>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@farmconnect.com" 
                className="w-full pl-10 pr-4 py-3 bg-[#f7fcf9] border border-emerald-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-gray-400 mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-gray-400" /></span>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••" 
                className="w-full pl-10 pr-10 py-3 bg-[#f7fcf9] border border-emerald-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            
            {authMode === 'register' && (
              <div className="mt-2 flex items-center justify-between">
                <div className="flex space-x-1 flex-1 mr-3">
                  <div className={`h-1.5 flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-gray-200'}`}></div>
                  <div className={`h-1.5 flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-gray-200'}`}></div>
                  <div className={`h-1.5 flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-gray-200'}`}></div>
                  <div className={`h-1.5 flex-1 rounded-full ${strength.score >= 4 ? strength.color : 'bg-gray-200'}`}></div>
                </div>
                <span className="text-xs font-bold text-emerald-700">{strength.label}</span>
              </div>
            )}
          </div>

          {role === 'farmer' && authMode === 'register' && (
            <div className="p-4 bg-[#f0f9f4] border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Farmland Photo for Verification
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Required for Farmers</span>
              </div>

              {!farmlandFile ? (
                <label className="border-2 border-dashed border-emerald-300 rounded-xl p-4 text-center bg-white/60 block cursor-pointer hover:bg-emerald-50/50 transition">
                  <ImageIcon className="h-8 w-8 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-700 font-medium">Tap to upload or take photo of your farmland</p>
                  <p className="text-[10px] text-gray-400 mb-2">PNG, JPG or HEIC up to 10MB</p>
                  <span className="inline-block px-3 py-1 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg shadow-xs">
                    Browse Files
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-100 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    {farmlandPreview ? (
                      <img src={farmlandPreview} alt="Farmland preview" className="h-10 w-10 object-cover rounded-lg border border-emerald-200" />
                    ) : (
                      <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-800 font-bold text-[10px]">IMG</div>
                    )}
                    <div className="truncate">
                      <p className="font-semibold text-gray-800 truncate">{farmlandFile.name} <span className="text-[10px] text-gray-400">({(farmlandFile.size / 1024 / 1024).toFixed(1)} MB)</span></p>
                      <p className="text-[10px] text-emerald-600 flex items-center gap-1">✓ Ready for verification</p>
                    </div>
                  </div>
                  <X className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={handleRemoveFile} />
                </div>
              )}
            </div>
          )}

          <div className="flex items-start gap-2 pt-1">
            <input type="checkbox" defaultChecked className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500" />
            <p className="text-[11px] text-gray-600 leading-tight">
              I agree to FarmConnect <span className="text-emerald-700 underline cursor-pointer">Terms of Service</span> and the <span className="text-emerald-700 underline cursor-pointer">Fresh Quality Pledge</span>.
            </p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#00663b] hover:bg-[#005531] disabled:opacity-60 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{authMode === 'register' ? 'Registering...' : 'Signing In...'}</span>
              </>
            ) : (
              <>
                <span>{authMode === 'register' ? 'Register / Get Started' : 'Sign In to FarmConnect'}</span> →
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 pt-1">
          {authMode === 'register' ? (
            <>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => { setAuthMode('login'); setError(null); }}
                className="text-emerald-700 font-bold underline"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Need a new account?{' '}
              <button 
                type="button" 
                onClick={() => { setAuthMode('register'); setError(null); }}
                className="text-emerald-700 font-bold underline"
              >
                Register
              </button>
            </>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px]">
          <span className="text-gray-400">Quick Navigation:</span>
          <button type="button" onClick={() => onNavigate('farmer')} className="text-emerald-700 font-bold hover:underline">Farmer</button> • 
          <button type="button" onClick={() => onNavigate('market')} className="text-emerald-700 font-bold hover:underline">Market</button> • 
          <button type="button" onClick={() => onNavigate('tracking')} className="text-emerald-700 font-bold hover:underline">Tracking</button> • 
          <button type="button" onClick={() => onNavigate('admin')} className="text-emerald-700 font-bold hover:underline">Admin</button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-emerald-800 flex items-center gap-1.5 font-medium">
        <span>🍃</span> 100% Verified Local Growers & Safe Payments
      </div>
    </div>
  );
}