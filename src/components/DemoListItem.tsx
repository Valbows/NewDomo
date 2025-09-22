 import React from 'react';
 import Link from 'next/link';
 import { MoreVertical } from 'lucide-react';
 import type { Demo } from '@/app/demos/[demoId]/configure/types';
 
 function formatDate(iso?: string | null) {
   if (!iso) return '—';
   try {
     return new Date(iso).toLocaleDateString();
   } catch {
     return '—';
   }
 }
 
 function countConversations(analytics: any): number {
   try {
     const conv = analytics?.conversations || {};
     return Object.keys(conv).length;
   } catch {
     return 0;
   }
 }
 
 interface Props {
   demo: Demo;
 }
 
 const DemoListItem: React.FC<Props> = ({ demo }) => {
   const analytics = demo?.metadata?.analytics as
     | { last_updated?: string; conversations?: Record<string, any> }
     | undefined;
   const convCount = countConversations(analytics);
   const lastUpdated = analytics?.last_updated || null;
 
   const isActive = Boolean(demo.tavus_persona_id || demo.tavus_conversation_id);
 
   return (
     <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between border border-gray-100">
       <div className="min-w-0">
         <h3 className="text-lg font-bold text-domo-dark-text truncate">{demo.name}</h3>
         <p className="text-xs text-domo-light-text mt-1">
           Created: {formatDate(demo.created_at)}
           {lastUpdated ? ` • Analytics updated: ${new Date(lastUpdated).toLocaleString()}` : ''}
         </p>
         <p className="text-xs text-gray-500 mt-1">Conversations tracked: {convCount}</p>
       </div>
       <div className="flex items-center space-x-3">
         <span
           className={`px-2 py-1 text-xs font-semibold rounded-full ${
             isActive ? 'text-domo-success bg-green-100' : 'text-gray-600 bg-gray-100'
           }`}
         >
           {isActive ? 'Active' : 'Draft'}
         </span>
         <Link
           href={`/demos/${demo.id}/experience`}
           className="text-xs px-3 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
         >
           View
         </Link>
        <Link
          href={`/demos/${demo.id}/onboarding`}
          className="text-xs px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          Setup
        </Link>
        <Link
          href={`/demos/${demo.id}/configure`}
          className="text-xs px-3 py-1 rounded bg-gray-50 text-gray-700 hover:bg-gray-100"
        >
          Manage
        </Link>
         <button className="text-domo-light-text hover:text-domo-dark-text">
           <MoreVertical size={20} />
         </button>
       </div>
     </div>
   );
 };
 
 export default DemoListItem;
