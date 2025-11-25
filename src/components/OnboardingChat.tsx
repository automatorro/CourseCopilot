import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import { AIMessage, Course, CourseBlueprint } from '../types';
import { supabase } from '../services/supabaseClient';

interface OnboardingChatProps {
    course: Course;
    onBlueprintReady: (blueprint: CourseBlueprint) => void;
}

const OnboardingChat: React.FC<OnboardingChatProps> = ({ course, onBlueprintReady }) => {
    const [messages, setMessages] = useState<AIMessage[]>((course.ai_refinement_history as AIMessage[]) || []);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (messages.length === 0) {
            // Initial greeting
            const initialMessage: AIMessage = {
                role: 'assistant',
                content: `Hello! I'm your AI Course Co-Pilot. I see you want to create a **${course.environment}** course on **"${course.title}"**. \n\nTo build the perfect structure for you, I need to know a bit more. \n\n**What is the main goal you want your participants to achieve by the end of this course?**`,
                timestamp: Date.now(),
                action: 'onboarding_greeting',
            };
            setMessages([initialMessage]);
            saveChatHistory([initialMessage]);
        }
    }, []);

    const saveChatHistory = async (newHistory: AIMessage[]) => {
        try {
            await supabase
                .from('courses')
                .update({ ai_refinement_history: newHistory })
                .eq('id', course.id);
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: AIMessage = {
            role: 'user',
            content: input,
            timestamp: Date.now(),
            action: 'user_response',
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);
        saveChatHistory(newMessages);

        try {
            // Call Edge Function to process chat and potentially generate blueprint
            const { data, error } = await supabase.functions.invoke('generate-course-content', {
                body: {
                    action: 'chat_onboarding',
                    course: course,
                    chat_history: newMessages,
                },
            });

            if (error) throw error;

            const aiMsg: AIMessage = {
                role: 'assistant',
                content: data.reply,
                timestamp: Date.now(),
                action: 'chat_response',
            };

            const updatedMessages = [...newMessages, aiMsg];
            setMessages(updatedMessages);
            saveChatHistory(updatedMessages);

            if (data.blueprint) {
                // Blueprint generated!
                onBlueprintReady(data.blueprint);
            }

        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg: AIMessage = {
                role: 'assistant',
                content: 'I apologize, but I encountered an error processing your request. Please try again.',
                timestamp: Date.now(),
                action: 'error',
            };
            setMessages([...newMessages, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="bg-primary-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <Sparkles className="text-white" size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">AI Course Architect</h3>
                        <p className="text-primary-100 text-xs">Designing: {course.title}</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary-100 text-primary-600' : 'bg-indigo-100 text-indigo-600'
                            }`}>
                            {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'
                            }`}>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Bot size={20} />
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Type your answer..."
                        className="flex-1 input-premium"
                        disabled={isTyping}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="btn-premium px-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isTyping ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingChat;
