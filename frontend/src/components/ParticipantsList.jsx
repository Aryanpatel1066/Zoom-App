// export default function ParticipantsList({ participants }) {
//   return (
//     <div className="p-3">
//       <h3 className="text-lg font-semibold mb-2 text-gray-500">
//         Participants ({participants?.length || 0})
//       </h3>
//       <ul>
//         {participants?.map((p) => (
//           <li key={p.socketId} className="flex items-center gap-3 py-2">
//             <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
//               {(p.name || "U").charAt(0)}
//             </div>

//             <div className="flex-1">
//               <div className="flex items-center gap-2">
//                 {p.isHost && (
//                   <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
//                     Host
//                   </span>
//                 )}
//               </div>

//               {p.email && (
//                 <div className="text-xs text-gray-500">email: {p.email}</div>
//               )}
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
