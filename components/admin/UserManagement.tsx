
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, UserRole } from '../../types';
import { Search, Shield, Trash2, AlertTriangle, X } from 'lucide-react';

const UserManagement: React.FC = () => {
    const { users, currentUser, updateUserRole, deleteUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingRole, setEditingRole] = useState<string | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const roles: UserRole[] = ['admin', 'it', 'editor', 'author', 'moderator', 'vip', 'user'];

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRoleChange = async (userId: string, newRole: string) => {
        await updateUserRole(userId, newRole as UserRole);
        setEditingRole(null);
    };

    const handleDeleteClick = (e: React.MouseEvent, user: User) => {
        e.stopPropagation();
        e.preventDefault();
        setUserToDelete(user);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            await deleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };

    return (
        <div>
             {/* Delete Confirmation Modal */}
             {userToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setUserToDelete(null)}>
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center text-red-600">
                                <div className="bg-red-100 p-2 rounded-full mr-3">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="font-bold text-lg">Benutzer löschen?</h3>
                            </div>
                            <button onClick={() => setUserToDelete(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <p className="text-slate-600 mb-6 leading-relaxed">
                            Bist du sicher, dass du den Benutzer <strong>{userToDelete.username}</strong> ({userToDelete.email}) unwiderruflich löschen möchtest?
                        </p>
                        
                        <div className="flex space-x-3 justify-end">
                            <button 
                                onClick={() => setUserToDelete(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold uppercase text-xs rounded hover:bg-slate-200 transition-colors"
                            >
                                Abbrechen
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white font-bold uppercase text-xs rounded hover:bg-red-700 transition-colors shadow-sm flex items-center"
                            >
                                <Trash2 size={14} className="mr-2" /> Löschen
                            </button>
                        </div>
                    </div>
                </div>
             )}

             {/* Toolbar */}
             <div className="flex justify-between items-center mb-6">
                 <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Benutzer suchen..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-f1-pink bg-white text-slate-900"
                    />
                </div>
                <div className="text-sm text-slate-500">
                    Total Users: <span className="font-bold text-slate-900">{users.length}</span>
                </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                         <tr>
                             <th className="p-4">User</th>
                             <th className="p-4">Rolle</th>
                             <th className="p-4">Dabei seit</th>
                             <th className="p-4 text-right">Aktionen</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {filteredUsers.map(user => {
                             const isMe = currentUser?.id === user.id;
                             
                             return (
                                 <tr key={user.id} className={`transition-colors ${isMe ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                                     <td className="p-4">
                                         <div className="flex items-center">
                                             <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden mr-3 border border-slate-100">
                                                 <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`} alt="" className="w-full h-full object-cover" />
                                             </div>
                                             <div>
                                                 <div className="font-bold text-slate-900 flex items-center">
                                                     {user.username}
                                                     {isMe && <span className="ml-2 text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wide">Du</span>}
                                                 </div>
                                                 <div className="text-xs text-slate-500">{user.email}</div>
                                             </div>
                                         </div>
                                     </td>
                                     <td className="p-4">
                                         {editingRole === user.id ? (
                                             <div className="flex items-center space-x-2">
                                                 <select 
                                                    className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-900 focus:outline-none focus:border-f1-pink focus:ring-1 focus:ring-f1-pink"
                                                    defaultValue={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    autoFocus
                                                    onBlur={() => setEditingRole(null)}
                                                >
                                                     {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                                 </select>
                                             </div>
                                         ) : (
                                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                 user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                 user.role === 'it' ? 'bg-blue-100 text-blue-700' :
                                                 user.role === 'editor' ? 'bg-green-100 text-green-700' :
                                                 user.role === 'author' ? 'bg-orange-100 text-orange-700' :
                                                 user.role === 'vip' ? 'bg-yellow-100 text-yellow-700' :
                                                 'bg-slate-100 text-slate-600'
                                             }`}>
                                                 {user.role}
                                             </span>
                                         )}
                                     </td>
                                     <td className="p-4 text-slate-500 text-xs">
                                         {user.joinedDate}
                                     </td>
                                     <td className="p-4 text-right">
                                         <div className="flex justify-end space-x-2">
                                             <button 
                                                onClick={() => setEditingRole(user.id)} 
                                                className="p-2 text-slate-400 hover:text-f1-pink transition-colors bg-white border border-slate-200 rounded hover:border-f1-pink"
                                                title="Rolle bearbeiten"
                                             >
                                                 <Shield size={14} />
                                             </button>
                                             <button 
                                                onClick={(e) => handleDeleteClick(e, user)} 
                                                disabled={isMe}
                                                className={`p-2 transition-colors border rounded ${isMe ? 'text-slate-200 border-slate-100 cursor-not-allowed' : 'text-slate-400 border-slate-200 hover:text-red-600 hover:border-red-200 bg-white'}`}
                                                title={isMe ? "Du kannst dich nicht selbst löschen" : "Benutzer löschen"}
                                             >
                                                 <Trash2 size={14} />
                                             </button>
                                         </div>
                                     </td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
                 {filteredUsers.length === 0 && (
                     <div className="p-8 text-center text-slate-400 italic text-sm">
                         Keine Benutzer gefunden.
                     </div>
                 )}
             </div>
        </div>
    );
};

export default UserManagement;
