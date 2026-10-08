// import { Component, HostListener, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { AVATAR_URLS } from '@/assets/cloudinaryUrl';

// @Component({
//   selector: 'app-chatbot',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   template: `
//     <div *ngIf="!isOpen" class="fixed right-0 top-1/2 -translate-y-1/2 z-40 group select-none">
//       <button
//         (click)="openChat()"
//         class="flex items-center justify-center w-7 h-11 bg-slate-900/90 dark:bg-[#0c121c]/90 hover:bg-sky-600 dark:hover:bg-sky-600 text-slate-200 hover:text-white rounded-l-lg border-y border-l border-slate-700/60 shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer"
//         aria-label="Open Chatbot"
//       >
//         <span class="font-mono text-xs font-bold tracking-tighter"> &lt;&lt; </span>
//       </button>

//       <div
//         class="absolute right-full top-1/2 -translate-y-1/2 mr-2.5 px-2.5 py-1 rounded-md bg-slate-900/95 text-white text-[11px] font-mono font-medium shadow-xl border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
//       >
//         Open Chatbot
//       </div>
//     </div>

//     <div
//       *ngIf="isOpen"
//       (click)="closeChat()"
//       class="fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-md transition-opacity duration-300"
//     ></div>

//     <aside
//       class="fixed top-0 right-0 h-full w-full sm:w-[440px] lg:w-[40%] bg-[#081225]/95 text-slate-100 z-[70] flex flex-col shadow-2xl border-l border-slate-800/80 backdrop-blur-xl transition-transform duration-300 ease-out"
//       [class.translate-x-0]="isOpen"
//       [class.translate-x-full]="!isOpen"
//       (click)="$event.stopPropagation()"
//     >
//       <header
//         class="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#060d1b]/60"
//       >
//         <div class="flex items-center gap-2.5">
//           <div
//             class="w-8 h-8 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0"
//           >
//             <span class="text-[8px] font-mono font-bold tracking-tighter text-sky-400">
//               [V.T.T]
//             </span>
//           </div>

//           <div>
//             <h3 class="text-xs font-bold tracking-wider font-mono text-white uppercase">
//               V.T.Thanh Virtual Assistant
//             </h3>
//             <div class="flex items-center gap-1.5 mt-0.5">
//               <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
//               <span
//                 class="text-[9px] font-mono tracking-widest text-emerald-400 uppercase font-semibold"
//               >
//                 Active
//               </span>
//             </div>
//           </div>
//         </div>

//         <button
//           (click)="closeChat()"
//           class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
//           aria-label="Close Chatbot"
//         >
//           <svg
//             class="w-4 h-4"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             stroke-width="2"
//             stroke-linecap="round"
//             stroke-linejoin="round"
//           >
//             <line x1="18" y1="6" x2="6" y2="18"></line>
//             <line x1="6" y1="6" x2="18" y2="18"></line>
//           </svg>
//         </button>
//       </header>

//       <div class="flex-1 overflow-y-auto px-5 py-5 space-y-5">
//         <div class="flex items-start gap-2.5">
//           <div
//             class="w-7 h-7 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5"
//           >
//             <span class="text-[7px] font-mono text-sky-400 font-bold"> [V.T] </span>
//           </div>

//           <div class="flex flex-col items-start max-w-[85%]">
//             <div
//               class="p-3.5 rounded-xl rounded-tl-xs bg-[#112340] text-slate-100 text-[13px] leading-relaxed border border-slate-700/40 shadow-md"
//             >
//               Hi! I'm the virtual version of Van Trung Thanh. How can I help you today?
//             </div>
//             <span class="text-[9px] font-mono text-slate-500 mt-1 ml-1"> 11:08 AM </span>
//           </div>
//         </div>

//         <div class="pt-1">
//           <span
//             class="text-[10px] font-mono uppercase tracking-widest text-sky-400/80 block mb-2.5 font-semibold"
//           >
//             Suggested Topics
//           </span>

//           <div class="space-y-2">
//             <button
//               *ngFor="let topic of suggestedTopics"
//               (click)="selectTopic(topic)"
//               class="w-full text-left px-3.5 py-2.5 rounded-lg bg-[#0f1d33]/80 hover:bg-[#152744] border border-slate-700/50 hover:border-sky-500/50 text-xs font-mono text-slate-200 transition-all shadow-xs cursor-pointer"
//             >
//               {{ topic }}
//             </button>
//           </div>
//         </div>
//       </div>

//       <footer class="p-4 border-t border-slate-800/80 bg-[#060d1b]/70 space-y-2.5">
//         <div class="flex items-center gap-2">
//           <input
//             type="text"
//             [(ngModel)]="messageInput"
//             placeholder="Ask me anything"
//             class="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0b172a] border border-slate-700/60 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
//           />
//           <button
//             class="w-9 h-9 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center transition-colors shadow-md shadow-sky-600/30 shrink-0 cursor-pointer"
//             aria-label="Send Message"
//           >
//             <svg
//               class="w-4 h-4 -rotate-45 ml-0.5"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               stroke-width="2"
//               stroke-linecap="round"
//               stroke-linejoin="round"
//             >
//               <line x1="22" y1="2" x2="11" y2="13"></line>
//               <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
//             </svg>
//           </button>
//         </div>

//         <p class="text-[9.5px] text-slate-400/80 font-mono leading-relaxed text-center px-1">
//           ⚠️ AI-generated content only. Responses do not constitute legal, financial, medical, or
//           life advice of any kind. The site owner assumes no liability for any decisions or outcomes
//           resulting from use of this chatbot. Use at your own discretion.
//         </p>
//       </footer>
//     </aside>
//   `,
// })
// export class ChatbotComponent implements OnDestroy {
//   public readonly avatarUrls = AVATAR_URLS;
//   public isOpen = false;
//   public messageInput = '';

//   public readonly suggestedTopics: string[] = [
//     'What is my tech stack?',
//     'View my projects',
//     'How can I contact me?',
//   ];

//   public openChat(): void {
//     this.isOpen = true;
//     document.body.style.overflow = 'hidden';
//   }

//   public closeChat(): void {
//     this.isOpen = false;
//     document.body.style.overflow = '';
//   }

//   public selectTopic(topic: string): void {
//     this.messageInput = topic;
//   }

//   ngOnDestroy(): void {
//     document.body.style.overflow = '';
//   }

//   @HostListener('window:keydown.escape')
//   public onEscape(): void {
//     if (this.isOpen) {
//       this.closeChat();
//     }
//   }
// }
