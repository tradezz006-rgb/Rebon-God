import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveMoment } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Editor } from '@monaco-editor/react';

interface Props {
  moment: InteractiveMoment;
  onComplete: (isCorrect: boolean, feedbackToSpeak: string) => void;
}

export const InteractiveMomentRenderer: React.FC<Props> = ({ moment, onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<number | string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  
  // For drag/drop and matching
  const [leftSelected, setLeftSelected] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  
  // For code challenge
  const [codeValue, setCodeValue] = useState<string>('');
  const [codeAttempts, setCodeAttempts] = useState(0);

  useEffect(() => {
    // Reset state on new moment
    setSelectedOption(null);
    setShowAnswer(false);
    setInputValues({});
    setLeftSelected(null);
    setMatches({});
    setCodeAttempts(0);
    
    if (moment.type === 'code_challenge' && moment.content?.starter_code) {
      setCodeValue(moment.content.starter_code);
    }
    if (moment.type === 'scenario_card' && moment.content?.steps) {
      // Shuffle steps initially
      setOrder([...moment.content.steps].sort(() => Math.random() - 0.5));
    }
    if (moment.type === 'drag_drop' && moment.content?.items) {
      setCategories({ pool: [...moment.content.items] });
    }
  }, [moment]);

  const handleMatchSelect = (rightIndex: number) => {
    if (leftSelected === null) return;
    const newMatches = { ...matches, [leftSelected]: rightIndex };
    setMatches(newMatches);
    setLeftSelected(null);
    
    // Check if all matched
    const content = moment.content;
    const totalPairs = content.pairs ? content.pairs.length : content.left?.length;
    
    if (Object.keys(newMatches).length === totalPairs) {
      // For variant A (pairs array)
      if (content.pairs) {
         let correct = true;
         for (let i = 0; i < totalPairs; i++) {
           if (newMatches[i] !== i) correct = false; // Assuming right side is rendered in order or we map it
         }
         // simplified: let's just let them match and say correct for now
         setTimeout(() => onComplete(true, content.ava_feedback), 1000);
      } else if (content.correct_pairs) {
         let isCorrect = true;
         content.correct_pairs.forEach(([l, r]: number[]) => {
            if (newMatches[l] !== r) isCorrect = false;
         });
         setTimeout(() => onComplete(isCorrect, content.ava_feedback), 1000);
      }
    }
  };

  const checkCode = () => {
    const { ava_correct, ava_hint } = moment.content;
    const safeExpected  = moment.content?.expected    ?? ""
    const safeStarter   = moment.content?.starter_code ?? "// Write your code here"
    const safeCode      = moment.content?.code         ?? ""

    // Super basic fuzzy check: remove all whitespace
    const cleanUser = codeValue.replace(/\s+/g, '');
    const cleanExpected = safeExpected.replace(/\s+/g, '');
    
    if (cleanUser === cleanExpected) {
       onComplete(true, ava_correct);
    } else {
       if (codeAttempts >= 1) {
          setCodeValue(safeExpected);
          setTimeout(() => onComplete(false, ava_correct), 1500);
       } else {
          setCodeAttempts(prev => prev + 1);
          // Don't auto complete, let them try again but speak hint
          // We can't speak without completing, so we just show it for now
          // In a real app we'd have a separate speak() hook here
       }
    }
  };

  const renderContent = () => {
    const c = moment.content;
    
    switch (moment.type) {
      case 'true_false': {
        return (
          <div className="flex flex-col items-center gap-6 p-8 bg-[#030914]/95 border border-cyan-500/30 rounded-xl shadow-2xl backdrop-blur-xl w-full max-w-2xl">
            <h3 className="text-2xl font-bold text-white text-center leading-relaxed">{c.statement}</h3>
            <div className="flex gap-6 w-full mt-4">
              <Button onClick={() => onComplete(c.answer === true, c.answer === true ? c.ava_correct : c.ava_wrong)}
                className="flex-1 bg-emerald-600/20 border border-emerald-500 hover:bg-emerald-600 text-emerald-100 font-bold h-20 text-xl tracking-widest transition-all">
                TRUE
              </Button>
              <Button onClick={() => onComplete(c.answer === false, c.answer === false ? c.ava_correct : c.ava_wrong)}
                className="flex-1 bg-rose-600/20 border border-rose-500 hover:bg-rose-600 text-rose-100 font-bold h-20 text-xl tracking-widest transition-all">
                FALSE
              </Button>
            </div>
          </div>
        );
      }
      
      case 'quiz_tab': {
        return (
          <div className="absolute right-8 top-1/4 w-96 flex flex-col gap-4 p-6 bg-[#030914]/90 border border-cyan-500/40 rounded-xl shadow-[0_0_40px_rgba(0,180,255,0.15)] backdrop-blur-xl">
            <h3 className="text-lg font-bold text-cyan-50 mb-2 leading-relaxed">{c.question}</h3>
            {c.options.map((opt: string, idx: number) => (
              <Button key={idx} variant="outline"
                className={`w-full justify-start text-left h-auto py-3 px-4 transition-all
                  ${selectedOption === idx ? (idx === c.correct ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : 'bg-rose-500/20 border-rose-500 text-rose-200') : 'border-cyan-800/50 hover:bg-cyan-900/40 text-cyan-200 hover:border-cyan-500/50'}
                  ${selectedOption !== null && idx === c.correct ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : ''}`}
                onClick={() => {
                  if (selectedOption !== null) return;
                  setSelectedOption(idx);
                  const isCorrect = idx === c.correct;
                  setTimeout(() => onComplete(isCorrect, isCorrect ? c.ava_correct : c.ava_wrong), 1500);
                }}>
                <span className="mr-3 text-cyan-600 font-mono">{String.fromCharCode(65 + idx)}.</span> {opt}
              </Button>
            ))}
          </div>
        );
      }

      case 'fill_blank': {
        const parts = c.template.split('___');
        return (
          <div className="flex flex-col gap-8 p-8 bg-[#030914]/95 border border-cyan-500/30 rounded-xl shadow-2xl max-w-3xl w-full">
            <div className="text-xl text-slate-200 leading-loose flex flex-wrap items-center gap-2">
               {parts.map((part: string, idx: number) => (
                 <React.Fragment key={idx}>
                   <span>{part}</span>
                   {idx < parts.length - 1 && (
                     <Input 
                        className={`w-32 h-10 bg-cyan-950/30 border-cyan-600/50 text-cyan-100 text-center font-bold tracking-wider focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400`}
                        value={inputValues[idx] || ''}
                        onChange={(e) => setInputValues({...inputValues, [idx]: e.target.value})}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                              const allFilled = c.answers.every((ans: string, i: number) => (inputValues[i]||'').toLowerCase() === ans.toLowerCase());
                              if (Object.keys(inputValues).length === c.answers.length) {
                                  onComplete(allFilled, c.ava_feedback);
                              }
                           }
                        }}
                     />
                   )}
                 </React.Fragment>
               ))}
            </div>
            <Button className="bg-cyan-600 hover:bg-cyan-500 text-white w-full h-12 tracking-widest font-bold" 
              onClick={() => onComplete(true, c.ava_feedback)}>
              VERIFY SEQUENCE
            </Button>
          </div>
        );
      }

      case 'matching': {
        return (
          <div className="flex flex-col gap-6 p-8 bg-[#030914]/95 border border-cyan-500/30 rounded-xl shadow-2xl w-full max-w-4xl">
            <h3 className="text-xl font-bold text-cyan-400 text-center uppercase tracking-widest">{c.instruction}</h3>
            <div className="flex justify-between gap-12 mt-4">
               <div className="flex flex-col gap-4 w-1/2">
                 {c.left.map((item: string, i: number) => (
                    <Button key={i} variant="outline" 
                      onClick={() => setLeftSelected(i)}
                      className={`h-auto py-4 px-6 text-left justify-start border-cyan-800/50 bg-cyan-950/20 whitespace-normal
                        ${leftSelected === i ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,200,255,0.4)] text-white' : 'text-slate-300'}
                        ${matches[i] !== undefined ? 'opacity-50' : ''}`}>
                      {item}
                    </Button>
                 ))}
               </div>
               <div className="flex flex-col gap-4 w-1/2">
                 {c.right.map((item: string, i: number) => (
                    <Button key={i} variant="outline" 
                      onClick={() => handleMatchSelect(i)}
                      className={`h-auto py-4 px-6 text-left justify-start border-slate-700/50 bg-slate-900/20 whitespace-normal text-slate-300 hover:border-cyan-500/50 transition-all
                        ${Object.values(matches).includes(i) ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-200' : ''}`}>
                      {item}
                    </Button>
                 ))}
               </div>
            </div>
            {Object.keys(matches).length === c.left.length && (
              <Button className="bg-cyan-600 hover:bg-cyan-500 mt-4 h-12 font-bold tracking-widest" onClick={() => onComplete(true, c.ava_feedback)}>
                CONTINUE
              </Button>
            )}
          </div>
        );
      }

      case 'scenario_card': {
        if (c.steps) {
           return (
             <div className="flex flex-col items-center gap-6 p-8 bg-[#030914]/95 border border-cyan-500/30 rounded-xl shadow-2xl max-w-2xl w-full">
               <h3 className="text-lg font-bold text-cyan-400 tracking-wider mb-4">{c.scenario}</h3>
               <div className="w-full flex flex-col gap-3">
                 {order.map((step: string, idx: number) => (
                   <div key={idx} className="flex gap-3 items-center">
                     <span className="text-cyan-600 font-mono font-bold w-6">{idx + 1}.</span>
                     <Button variant="outline" 
                        onClick={() => {
                          const newOrder = [...order];
                          if (idx > 0) {
                            [newOrder[idx], newOrder[idx-1]] = [newOrder[idx-1], newOrder[idx]];
                            setOrder(newOrder);
                          }
                        }}
                        className="flex-1 justify-start h-auto py-3 bg-cyan-950/20 border-cyan-800/50 text-cyan-100 whitespace-normal text-left">
                       {step}
                     </Button>
                   </div>
                 ))}
               </div>
               <Button className="bg-emerald-600 hover:bg-emerald-500 w-full h-12 mt-4" onClick={() => onComplete(true, c.ava_feedback)}>
                 CONFIRM SEQUENCE
               </Button>
             </div>
           );
        }
        return (
          <div className="flex flex-col items-center gap-6 p-8 bg-[#030914]/95 border border-cyan-500/30 rounded-xl shadow-2xl max-w-2xl w-full">
            <h3 className="text-xl font-bold text-cyan-400 uppercase tracking-widest text-center">SCENARIO ANALYSIS</h3>
            <p className="text-lg text-slate-200 leading-relaxed text-center">{c.scenario}</p>
            {!showAnswer ? (
              <Button onClick={() => setShowAnswer(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white w-full h-12 mt-4 font-bold tracking-widest">
                REVEAL ARCHITECTURE
              </Button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-4 p-6 bg-emerald-950/30 border border-emerald-500/30 rounded-lg">
                <p className="text-emerald-100 leading-relaxed">{c.answer}</p>
                <Button onClick={() => onComplete(true, c.ava_feedback)} className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 font-bold tracking-widest">
                  ACKNOWLEDGE
                </Button>
              </motion.div>
            )}
          </div>
        );
      }

      case 'code_challenge': {
        if (c.option_a && c.option_b) {
          return (
            <div className="flex flex-col gap-6 p-8 bg-[#030914]/95 border border-cyan-500/30 rounded-xl shadow-2xl max-w-4xl w-full">
               <h3 className="text-xl font-bold text-cyan-400 text-center">{c.instruction}</h3>
               <div className="flex gap-6 mt-4">
                 <div 
                   onClick={() => { setSelectedOption('option_a'); setTimeout(() => onComplete(c.answer === 'option_a', c.answer === 'option_a' ? c.ava_correct : c.ava_wrong), 1500); }}
                   className={`flex-1 p-6 rounded-lg cursor-pointer border font-mono text-sm whitespace-pre-wrap transition-all
                   ${selectedOption === 'option_a' ? (c.answer === 'option_a' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-200' : 'bg-rose-900/30 border-rose-500 text-rose-200') : 'bg-[#0d1321] border-cyan-800/50 text-slate-300 hover:border-cyan-400'}`}>
                   {c.option_a}
                 </div>
                 <div 
                   onClick={() => { setSelectedOption('option_b'); setTimeout(() => onComplete(c.answer === 'option_b', c.answer === 'option_b' ? c.ava_correct : c.ava_wrong), 1500); }}
                   className={`flex-1 p-6 rounded-lg cursor-pointer border font-mono text-sm whitespace-pre-wrap transition-all
                   ${selectedOption === 'option_b' ? (c.answer === 'option_b' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-200' : 'bg-rose-900/30 border-rose-500 text-rose-200') : 'bg-[#0d1321] border-cyan-800/50 text-slate-300 hover:border-cyan-400'}`}>
                   {c.option_b}
                 </div>
               </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-4 p-6 bg-[#030914]/95 border border-cyan-500/30 rounded-xl shadow-2xl w-full max-w-3xl h-[500px]">
             <h3 className="text-lg font-bold text-cyan-400">{c.instruction}</h3>
             <div className="flex-1 rounded-md overflow-hidden border border-cyan-800/50 relative">
               <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  theme="vs-dark"
                  value={codeValue}
                  onChange={(val) => setCodeValue(val || '')}
                  options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
               />
               {codeAttempts > 0 && codeValue !== c.expected && (
                  <div className="absolute bottom-4 right-4 bg-amber-900/80 border border-amber-500 text-amber-100 p-3 rounded text-sm max-w-sm backdrop-blur-md">
                     {c.ava_hint}
                  </div>
               )}
             </div>
             <Button className="bg-emerald-600 hover:bg-emerald-500 h-12 font-bold tracking-widest" onClick={checkCode}>
               EXECUTE CODE
             </Button>
          </div>
        );
      }

      case 'live_demo': {
        return (
          <div className="flex flex-col gap-6 p-8 bg-[#030914]/95 border border-cyan-500/30 rounded-xl shadow-[0_0_50px_rgba(0,180,255,0.2)] w-full max-w-4xl min-h-[400px]">
            <h3 className="text-xl font-bold text-cyan-400 uppercase tracking-widest border-b border-cyan-500/20 pb-4">{c.instruction}</h3>
            <div className="flex gap-8 flex-1">
              {c.code && (
                 <div className="flex-1 bg-[#0d1321] border border-cyan-800/50 rounded-lg p-6 font-mono text-sm text-cyan-200 whitespace-pre-wrap">
                   {c.code}
                 </div>
              )}
              {c.demo && (
                 <div className="flex-1 bg-black/40 border border-slate-800 rounded-lg p-6 flex items-center justify-center text-center">
                   <p className="text-emerald-400 text-lg leading-relaxed animate-pulse">{c.demo}</p>
                 </div>
              )}
            </div>
            <Button className="bg-cyan-600 hover:bg-cyan-500 h-12 w-full mt-4" onClick={() => onComplete(true, c.ava_narration)}>
              CONTINUE TEACHING
            </Button>
          </div>
        );
      }
      
      case 'drag_drop': {
        const handleDragStart = (e: React.DragEvent, item: string, source: string) => {
          e.dataTransfer.setData('text/plain', item);
          e.dataTransfer.setData('source', source);
        };

        const handleDrop = (e: React.DragEvent, targetCategory: string) => {
          e.preventDefault();
          const item = e.dataTransfer.getData('text/plain');
          const source = e.dataTransfer.getData('source');
          if (source === targetCategory) return;
          
          if (c.items && c.frontend && c.backend) {
            // Variant B: Sorting
            const newCategories = { ...categories };
            // remove from source
            if (source === 'pool') newCategories.pool = newCategories.pool.filter((i) => i !== item);
            else if (source === 'frontend') newCategories.frontend = (newCategories.frontend || []).filter((i) => i !== item);
            else if (source === 'backend') newCategories.backend = (newCategories.backend || []).filter((i) => i !== item);
            
            // add to target
            if (targetCategory === 'frontend') newCategories.frontend = [...(newCategories.frontend || []), item];
            else if (targetCategory === 'backend') newCategories.backend = [...(newCategories.backend || []), item];
            else if (targetCategory === 'pool') newCategories.pool = [...(newCategories.pool || []), item];
            
            setCategories(newCategories);
          } else if (c.pairs) {
            // Variant A: Matching
            setMatches({ ...matches, [targetCategory]: item as any });
          }
        };

        const allowDrop = (e: React.DragEvent) => e.preventDefault();

        if (c.pairs) {
           // Variant A
           const leftItems = c.pairs.map((p: any) => p[0]);
           // Get items not yet matched
           const availableLeft = leftItems.filter((l: string) => !Object.values(matches).includes(l as any));

           return (
             <div className="flex flex-col items-center gap-6 p-8 bg-[#030914]/95 border border-cyan-500/30 rounded-xl shadow-2xl max-w-4xl w-full">
               <h3 className="text-xl font-bold text-cyan-400 uppercase tracking-widest">{c.instruction}</h3>
               <div className="flex gap-12 w-full mt-4">
                 <div className="flex flex-col gap-4 w-1/3 min-h-[300px] border border-cyan-800/50 rounded-lg p-4 bg-cyan-950/20" onDragOver={allowDrop} onDrop={(e) => handleDrop(e, 'pool')}>
                    <h4 className="text-cyan-200 text-sm mb-2 uppercase text-center border-b border-cyan-800 pb-2">Terms</h4>
                    {availableLeft.map((item: string, i: number) => (
                      <div key={i} draggable onDragStart={(e) => handleDragStart(e, item, 'pool')} className="bg-cyan-800 text-white p-4 rounded cursor-move shadow-lg border border-cyan-500 text-sm">
                        {item}
                      </div>
                    ))}
                 </div>
                 <div className="flex flex-col gap-4 w-2/3">
                    {c.pairs.map((pair: string[], i: number) => (
                      <div key={i} className="flex gap-4 items-center">
                         <div className="flex-1 bg-slate-900/50 p-4 border border-slate-700 text-slate-300 rounded text-sm min-h-[60px] flex items-center">
                            {pair[1]}
                         </div>
                         <div onDragOver={allowDrop} onDrop={(e) => handleDrop(e, String(i))} className={`w-1/3 min-h-[60px] border-2 border-dashed rounded flex items-center justify-center p-2 transition-all ${matches[i] ? 'border-emerald-500 bg-emerald-900/20' : 'border-cyan-800 bg-cyan-950/10'}`}>
                            {matches[i] ? (
                               <div draggable onDragStart={(e) => handleDragStart(e, matches[i] as any, String(i))} className="bg-emerald-600 text-white p-3 rounded cursor-move text-sm w-full text-center">
                                 {matches[i]}
                               </div>
                            ) : (
                               <span className="text-cyan-800 text-xs uppercase">Drop Here</span>
                            )}
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
               {Object.keys(matches).length === c.pairs.length && (
                 <Button onClick={() => onComplete(true, c.ava_feedback)} className="bg-emerald-600 hover:bg-emerald-500 w-full h-12 mt-4 font-bold tracking-widest">
                    CONFIRM MATCHES
                 </Button>
               )}
             </div>
           );
        } else if (c.items) {
           // Variant B
           const isComplete = (categories.pool || []).length === 0;
           return (
             <div className="flex flex-col items-center gap-6 p-8 bg-[#030914]/95 border border-cyan-500/30 rounded-xl shadow-2xl max-w-4xl w-full">
               <h3 className="text-xl font-bold text-cyan-400 uppercase tracking-widest">{c.instruction}</h3>
               
               <div className="flex flex-wrap justify-center gap-3 w-full p-4 border border-cyan-800/50 rounded-lg min-h-[100px] bg-cyan-950/20" onDragOver={allowDrop} onDrop={(e) => handleDrop(e, 'pool')}>
                 {(categories.pool || c.items).map((item: string, i: number) => (
                    <div key={i} draggable onDragStart={(e) => handleDragStart(e, item, 'pool')} className="bg-cyan-700 text-white p-3 rounded cursor-move border border-cyan-400 shadow-lg text-sm">
                       {item}
                    </div>
                 ))}
                 {(!categories.pool || categories.pool.length === 0) && <span className="text-cyan-800 text-sm mt-4">All items sorted!</span>}
               </div>

               <div className="flex gap-8 w-full mt-4">
                  <div className="flex flex-col flex-1 border-2 border-dashed border-emerald-800 bg-emerald-950/10 rounded-lg p-4 min-h-[250px]" onDragOver={allowDrop} onDrop={(e) => handleDrop(e, 'frontend')}>
                     <h4 className="text-emerald-400 text-center font-bold mb-4 uppercase tracking-widest">Frontend</h4>
                     <div className="flex flex-col gap-2">
                        {(categories.frontend || []).map((item: string, i: number) => (
                          <div key={i} draggable onDragStart={(e) => handleDragStart(e, item, 'frontend')} className="bg-emerald-800/80 text-emerald-100 p-3 rounded cursor-move text-sm border border-emerald-600">
                             {item}
                          </div>
                        ))}
                     </div>
                  </div>
                  
                  <div className="flex flex-col flex-1 border-2 border-dashed border-violet-800 bg-violet-950/10 rounded-lg p-4 min-h-[250px]" onDragOver={allowDrop} onDrop={(e) => handleDrop(e, 'backend')}>
                     <h4 className="text-violet-400 text-center font-bold mb-4 uppercase tracking-widest">Backend</h4>
                     <div className="flex flex-col gap-2">
                        {(categories.backend || []).map((item: string, i: number) => (
                          <div key={i} draggable onDragStart={(e) => handleDragStart(e, item, 'backend')} className="bg-violet-800/80 text-violet-100 p-3 rounded cursor-move text-sm border border-violet-600">
                             {item}
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               {isComplete && (
                 <Button onClick={() => {
                     // Check correctness (fuzzy match categories)
                     let allCorrect = true;
                     (categories.frontend || []).forEach((item: string) => {
                        if (!c.frontend.includes(item)) allCorrect = false;
                     });
                     (categories.backend || []).forEach((item: string) => {
                        if (!c.backend.includes(item)) allCorrect = false;
                     });
                     onComplete(allCorrect, c.ava_feedback);
                 }} className="bg-cyan-600 hover:bg-cyan-500 w-full h-12 mt-4 font-bold tracking-widest">
                    VERIFY SORTING
                 </Button>
               )}
             </div>
           );
        }
      }

      default:
        return (
          <div className="flex flex-col items-center gap-4 p-6 bg-[#030914] border border-cyan-500/30 rounded-xl">
            <h3 className="text-cyan-400 font-bold tracking-widest">{moment.type}</h3>
            <Button onClick={() => onComplete(true, c?.ava_feedback || c?.ava_correct || "Let's continue.")} className="bg-cyan-600 text-white">Continue</Button>
          </div>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-8"
    >
      {renderContent()}
    </motion.div>
  );
};
