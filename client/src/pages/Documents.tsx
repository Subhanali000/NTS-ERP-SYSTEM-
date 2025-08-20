import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify'; // <-- Import toast
import "react-toastify/dist/ReactToastify.css"; // only if needed
import {
  FileText,
  Plus,
  Lock,
  Key,
  Search,
  Shield,Download,ArrowDownToLine,
} from 'lucide-react';
import { getCurrentUser, isDirector, isManager } from '../utils/auth';
import {
  generateExperienceCertificate,
  generateOfferLetter,
  generateInternshipCertificate,
  generateLOR
} from '../utils/documentGenerator';
const Documents: React.FC = () => {
  const user = getCurrentUser();
  const isDir = isDirector(user?.role ?? '');
  const isMgr = isManager(user?.role ?? '');
  const [searchTerm, setSearchTerm] = useState('');
const [selectedType, setSelectedType] = useState('');
const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const documentTypes = [
    { id: 'offer_letter', name: 'Offer Letter', description: 'Generate offer letter for new hires' },
    { id: 'experience_certificate', name: 'Experience Certificate', description: 'Certificate of employment experience' },
    { id: 'letter_of_recommendation', name: 'Letter of Recommendation', description: 'Professional recommendation letter' },
    { id: 'internship_certificate', name: 'Internship Certificate', description: 'Certificate for completed internships' }
  ];
interface DocumentData {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  url: string;
  is_protected?: boolean;
}
 
  const fetchDocuments = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token missing.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`https://nts-erp-system-629k.vercel.app/api/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
      console.log('Fetched documents:', response.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);
const handleDownload = async (doc: DocumentData): Promise<void> => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`https://nts-erp-system-629k.vercel.app/api/documents/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ documentId: doc.id }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      if (response.status === 404) {
        if (errorData.message === "File not found on server.") {
          toast.error("The file does not exist on the server.");
        } else if (errorData.message === "Document not found or access denied.") {
          toast.error("Access denied or document missing.");
        } else {
          toast.error("Document not found.");
        }
      } else if (response.status === 403) {
        toast.error("You are not authorized to download this file.");
      } else if (response.status === 400) {
        toast.error("Invalid request. Document ID missing.");
      } else {
        toast.error("Download failed due to server error.");
      }

      throw new Error(`Server error: ${errorData.message}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading document:", error);
    toast.error("Unexpected error occurred during download.");
  }
};





  const handleGenerate = async (docType: string) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Missing auth token.');
      return;
    }

    const profileRes = await axios.get(`https://nts-erp-system-629k.vercel.app/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const userData = profileRes.data;

    switch (docType) {
      case 'offer_letter':
        generateOfferLetter(userData, 'Software Engineer', '₹8,00,000'); // You can customize this
        break;
      case 'experience_certificate':
        generateExperienceCertificate(userData);
        break;
      case 'letter_of_recommendation':
        generateLOR(userData, 'HR Department');
        break;
      case 'internship_certificate':
        generateInternshipCertificate(userData);
        break;
      default:
        console.error('Unsupported document type');
    }

    fetchDocuments(); // Optional: Refresh after generation
  } catch (err) {
    console.error('Failed to generate document:', err);
    setError('Failed to generate document.');
  }
};

  const handleDocumentAccess = (doc: any) => {
    if (doc.userId === user?.id) {
      window.open(doc.url, '_blank');
    } else {
      setSelectedDocument(doc);
      setShowPasswordPrompt(true);
    }
  };

  const handlePasswordSubmit = () => {
    const correctPassword = 'hr2024secure';
    if (password === correctPassword) {
      setShowPasswordPrompt(false);
      setPassword('');
      setPasswordError('');
      window.open(selectedDocument.url, '_blank');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };
const userDocuments = documents.filter((doc) => {
  const matchesUser = doc.user_id === user?.id && !doc.is_protected;
  const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesType = selectedType ? doc.type === selectedType : true;
  return matchesUser && matchesSearch && matchesType;
});

const protectedDocuments = documents.filter((doc) => {
  const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesType = selectedType ? doc.type === selectedType : true;
  return doc.is_protected && matchesSearch && matchesType;
});
console.log("User:", user);
console.log("Filtered user documents:", userDocuments);
console.log("Filtered protected documents:", protectedDocuments);




  if (loading) return <div className="text-center py-8">Loading documents...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  const GenerateDocumentForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Document</h3>
        <div className="space-y-3">
          {documentTypes.map((docType) => (
            <button
              key={docType.id}
              onClick={() => handleGenerate(docType.id)}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-medium text-gray-900">{docType.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowGenerateForm(false)}
          className="w-full mt-4 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const PasswordPrompt = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Protected Document</h3>
          <p className="text-gray-600 mt-2">This document requires a password to access</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Password
            </label>
           <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  passwordError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter document password"
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
            </div>
            {passwordError && (
              <p className="text-red-600 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Security Notice</p>
                <p className="text-sm text-yellow-700">
                  This document contains sensitive information and requires authorization to access.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handlePasswordSubmit}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Access Document
            </button>
            <button
              onClick={() => {
                setShowPasswordPrompt(false);
                setPassword('');
                setPasswordError('');
                setSelectedDocument(null);
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }
 

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <ToastContainer position="top-right" autoClose={4000} />
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Manage and generate your employment documents</p>
        </div>
        <button
          onClick={() => setShowGenerateForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Document</span>
        </button>
      </div>

        {/* Document Generator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {documentTypes.map((docType) => (
          <div key={docType.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <button
                onClick={() => handleGenerate(docType.id)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{docType.name}</h3>
            <p className="text-sm text-gray-600">{docType.description}</p>
          </div>
        ))}
      </div>


      {/* My Documents Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
        type="text"
        placeholder="Search my documents..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

<select
      value={selectedType}
      onChange={(e) => setSelectedType(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">All Types</option>
      <option value="contract">Contract</option>
            <option value="review">Review</option>
      <option value="offer_letter">Offer Letter</option>
      <option value="experience_certificate">Experience Certificate</option>
      <option value="letter_of_recommendation">Letter of Recommendation</option>
      <option value="internship_certificate">Internship Certificate</option>
            
      <option value="other">Other</option>
    </select>

        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-green-600" />
            <span>My Documents</span>
          </h3>
          {userDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{doc.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{doc.type}</span>
                    <span>•</span>
                    <span>{new Date(doc.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                  </div>
                </div>
              </div>
             <button
  onClick={() => handleDownload(doc)}
  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
>
  <ArrowDownToLine className="w-4 h-4" />
  <span>Download</span>
</button>



            </div>
          ))}
        </div>
      </div>

      {/* Protected Documents Section (for Directors/Managers) */}
      {protectedDocuments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Lock className="w-5 h-5 text-red-600" />
              <span>Protected Documents</span>
              <span className="text-sm font-normal text-gray-500">(Password Required)</span>
            </h3>
            {protectedDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <Lock className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{doc.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{doc.type}</span>
                      <span>•</span>
                      <span>{new Date(doc.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span className="text-red-600 font-medium">Protected</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDocumentAccess(doc)}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-800 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Access</span>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Security Notice</p>
                <p className="text-sm text-yellow-700">
                  Protected documents require password authentication. Contact HR for access credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Documents Message */}
      {userDocuments.length === 0 && (
  <div className="text-center py-8">
    <p className="text-gray-500">No documents found</p>
    <button
      onClick={() => setShowGenerateForm(true)}
      className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
    >
      Generate your first document
    </button>
  </div>
)}

      {/* Modals */}
      {showGenerateForm && <GenerateDocumentForm />}
      {showPasswordPrompt && <PasswordPrompt />}
    </div>
  );
};

export default Documents;
