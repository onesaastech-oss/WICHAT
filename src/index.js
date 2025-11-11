import ReactDOM from 'react-dom/client';
import './index.css';
import Error_404 from './pages/error/Error_404';
import Dashboard from './pages/Dashboard';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './pages/Login';
import Register from './pages/Register';
import LiveChat from './pages/LiveChat';
import Template from './pages/Template';
import TemplateAdd from './pages/TemplateAdd';
import TemplateEdit from './pages/TemplateEdit';
import Contact from './pages/Contact';
import ContactGroup from './pages/ContactGroup';
import ContactGroupList from './pages/ContactGroupList';
import AgentManagement from './pages/AgentManagement';
import MyPlan from './pages/MyPlan';
import Blank from './pages/Blank';
import PermissionsList from './pages/PermissionsList';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Campaign from './pages/Campaign';

const GOOGLE_CLIENT_ID = "124604231994-dtnflivbu049428d1cg9ngfuhgq38efs.apps.googleusercontent.com";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dasboard" element={<Dashboard />} />
        <Route path="/live-chat" element={<LiveChat />} />
        <Route path="/live-chat/:phone" element={<LiveChat />} />
        <Route path="/template" element={<Template />} />
        <Route path="/template-add" element={<TemplateAdd />} />
        <Route path="/template-edit/:templateId" element={<TemplateEdit />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/contact-group" element={<ContactGroup />} />
        <Route path="/contact-group-list" element={<ContactGroupList />} />
        <Route path="/agent-management" element={<AgentManagement />} />
        <Route path="/my-plan" element={<MyPlan />} />
        <Route path="/permission-list" element={<PermissionsList />} />
        <Route path="/blank" element={<Blank />} />
        <Route path="/campaigns" element={<Campaign />} />
        {/* Login related page */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Add more routes as needed */}
        <Route path="*" element={<Error_404 />} />
      </Routes>
    </BrowserRouter>
  </GoogleOAuthProvider>
);