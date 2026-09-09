import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './RegisterPage.css';
import { validateRegisterForm } from '../utils/validators';
import { authService } from '../services/authService'; // use shared auth service
import InlineError from '../components/common/inLineError';

const AVATAR_BASE_URL = '/avatars';

// Available avatar image file names
const AVATARS = ['amit.png', 'galit.png', 'noa.png'];

// Convert a File object to base64 string along with its content type
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result; // data:<mime>;base64,XXXX
      const [meta, base64] = String(result).split(',');
      const contentType = meta.split(':')[1].split(';')[0];
      resolve({ base64, contentType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RegisterPage() {
  // Local state for form fields and UI feedback
  const [username, setUsername] = useState(''); // email
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  // State for avatar selection and preview
  const [avatarType, setAvatarType] = useState('default'); // 'default' | 'uploaded'
  const [selectedAvatarName, setSelectedAvatarName] = useState(AVATARS[0]); // One of the AVATARS
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    `${AVATAR_BASE_URL}/${AVATARS[0]}`
  );
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Basic client-side validation before calling the API
  function validate() {
    const hasPicture =
      avatarType === 'default' ? !!selectedAvatarName : !!uploadedFile;

    const pictureFileForValidation = hasPicture ? 'some-picture' : null;

    const errorMessage = validateRegisterForm({
      username,
      name,
      password,
      password2,
      pictureFile: pictureFileForValidation,
    });

    if (errorMessage) {
      setError(errorMessage);
      return false;
    }

    setError('');
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      let pictureData;
      let pictureContentType;

      if (avatarType === 'uploaded' && uploadedFile) {
        // user uploaded a custom picture and selected it
        const { base64, contentType } = await fileToBase64(uploadedFile);
        pictureData = base64;
        pictureContentType = contentType;
      } else {
        // user selected a default avatar from public directory
        const avatarUrl = `${AVATAR_BASE_URL}/${selectedAvatarName}`;
        const resp = await fetch(avatarUrl);
        const blob = await resp.blob();
        const file = new File([blob], selectedAvatarName, { type: blob.type });
        const { base64, contentType } = await fileToBase64(file);
        pictureData = base64;
        pictureContentType = contentType;
      }

      // use shared authService so all API logic and error handling is centralized
      await authService.register({
        username,
        password,
        name,
        picture: {
          data: pictureData,
          contentType: pictureContentType,
        },
      });

      navigate('/login');
    } catch (err) {
      // show server‑side validation errors (e.g. "Email already exists")
      setError(err.message || 'Registration failed');
    }
  }

  // when clicking a built‑in avatar
  function handleAvatarClick(file) {
    setAvatarType('default');
    setSelectedAvatarName(file);
    setPreviewUrl(`${AVATAR_BASE_URL}/${file}`);
  }

  // when clicking the uploaded avatar option
  function handleUploadedAvatarClick() {
    if (!uploadedPreviewUrl) return;
    setAvatarType('uploaded');
    setPreviewUrl(uploadedPreviewUrl);
  }

  // Handle file input change for uploading custom avatar
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);

    setAvatarType('uploaded');
    setUploadedFile(file);
    setUploadedPreviewUrl(localUrl);
    setPreviewUrl(localUrl);
  }

  return (
    <div className="page register-page">
      <div className="auth-card">
        <h1 className="auth-title">Register</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Email
            <input
              className="auth-input"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="auth-label">
            Full name
            <input
              className="auth-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="auth-label">
            Password
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <label className="auth-label">
            Confirm password
            <input
              className="auth-input"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <label className="auth-label">
            Choose avatar
            <div className="avatar-options">
              {AVATARS.map((file) => {
                const url = `${AVATAR_BASE_URL}/${file}`;
                const isSelected =
                  avatarType === 'default' && selectedAvatarName === file;
                return (
                  <button
                    key={file}
                    type="button"
                    className={`avatar-button ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => handleAvatarClick(file)}
                  >
                    <img src={url} alt={file} />
                  </button>
                );
              })}

              {uploadedPreviewUrl && (
                <button
                  type="button"
                  className={`avatar-button ${
                    avatarType === 'uploaded' ? 'selected' : ''
                  }`}
                  onClick={handleUploadedAvatarClick}
                >
                  <img src={uploadedPreviewUrl} alt="Uploaded avatar" />
                </button>
              )}
            </div>
          </label>

          <label className="auth-label">
            Or upload your own picture
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>

          {previewUrl && (
            <div className="picture-preview">
              <img src={previewUrl} alt="Preview" />
            </div>
          )}

          <InlineError message={error} className="ui-error--auth" />

          <button className="auth-button" type="submit">
            Register
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
