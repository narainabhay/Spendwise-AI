import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPercentage } from '../../lib/formatters';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiAssistantView: React.FC = () => {
  const { user } = useAuth();
  const { summary, transactions } = useFinance();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Welcome to SpendWise AI Financial Advisor 👋

I am your dedicated intelligence partner. I have already analyzed your current cash flows, budgets, and savings goals:

- **Net Balance**: ${formatCurrency(summary.totalBalance, user?.currency)}
- **Monthly Inflow**: ${formatCurrency(summary.monthlyIncome, user?.currency)}
- **Monthly Outflow**: ${formatCurrency(summary.monthlyExpense, user?.currency)}
- **Savings Rate**: ${formatPercentage(summary.savingsRate)}

Pick a prompt below or ask any question about your spending habits, budget adjustments, or long-term financial targets!`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const suggestedPrompts = [
    'Where did I spend the most this month?',
    'Why are my expenses increasing?',
    'Compare my spending with last month.',
    'How much can I save next month?',
    'Which categories exceed my budget?',
    'Suggest a realistic monthly budget.',
    'Find unusual spending patterns.',
    'Give me a personalized savings plan.',
  ];

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setApiKeyError(null);

    // Prepare strictly computed financial context
    const financialContext = {
      currencySymbol: user?.currency === 'INR' ? '₹' : '$',
      currencyCode: user?.currency || 'INR',
      openingBalance: summary.openingBalance,
      totalBalance: summary.totalBalance,
      monthlyIncome: summary.monthlyIncome,
      monthlyExpense: summary.monthlyExpense,
      netSavings: summary.netSavings,
      savingsRate: summary.savingsRate,
      averageDailyExpense: summary.averageDailyExpense,
      categoryBreakdown: summary.categoryBreakdown.map((c) => ({
        category: c.category,
        amount: c.amount,
        percentage: Number(c.percentage.toFixed(1)),
        transactionsCount: c.count,
      })),
      topExpenses: summary.topExpenses.map((t) => ({
        title: t.title,
        amount: t.amount,
        category: t.category,
        date: t.date,
      })),
      budgetPerformance: summary.budgetPerformance.map((b) => ({
        category: b.category,
        limit: b.limit,
        spent: b.spent,
        percentageUsed: Number(b.percentage.toFixed(1)),
        isOverBudget: b.isOverBudget,
        isNearLimit: b.isNearLimit,
      })),
      savingsGoals: summary.savingsGoalsSummary,
      monthOverMonth: {
        expenseChangePercent: Number(summary.monthOverMonth.expenseChangePercent.toFixed(1)),
        incomeChangePercent: Number(summary.monthOverMonth.incomeChangePercent.toFixed(1)),
        previousMonthExpense: summary.monthOverMonth.previousMonthExpense,
        currentMonthExpense: summary.monthOverMonth.currentMonthExpense,
      },
    };

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText.trim(),
          history,
          financialContext,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'GEMINI_API_KEY_MISSING') {
          setApiKeyError(data.message);
          // Intelligent offline mathematical response fallback
          const offlineReply = generateOfflineDiagnostic(userText, summary, user?.currency);
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: offlineReply,
              timestamp: new Date().toISOString(),
            },
          ]);
          return;
        }
        throw new Error(data.message || 'Error communicating with SpendWise AI');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Unable to complete request**: ${
            err?.message || 'Network error'
          }. Please check server logs or verify your Gemini configuration.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Top AI Indicator Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                SpendWise AI Financial Advisor
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Grounding Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Model: Gemini 3.8 Flash • Strictly calculated financial totals
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([messages[0]]);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {apiKeyError && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Gemini API Key Notice</p>
            <p className="mt-0.5 leading-relaxed">{apiKeyError}</p>
            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
              SpendWise computed your financial metrics mathematically below. Set your GEMINI_API_KEY in environment variables or the AI Studio Secrets panel for unrestricted generative dialogue.
            </p>
          </div>
        </div>
      )}

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-inner">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-sm ${
                  isUser
                    ? 'bg-indigo-600'
                    : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`relative max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-md rounded-tr-none'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-sm rounded-tl-none'
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {!isUser && (
                  <div className="mt-3 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                    <span>SpendWise AI Engine</span>
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Analyzing your financial data and formulating expert recommendations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 transition-colors shrink-0 border border-slate-200/60 dark:border-slate-700/60"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="shrink-0 relative flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your spending, budget, or savings plan..."
          className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-md shadow-indigo-600/25"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

// Mathematical fallback diagnostics when external API key is awaiting user setup
function generateOfflineDiagnostic(prompt: string, summary: any, currency = 'INR'): string {
  const p = prompt.toLowerCase();

  if (p.includes('most') || p.includes('highest')) {
    const top = summary.categoryBreakdown[0];
    if (!top) return `No expense records found yet to compute highest category.`;
    return `### Exact Financial Data Breakdown

- **Highest Expense Category**: **${top.category}**
- **Total Spent**: **${formatCurrency(top.amount, currency)}**
- **Share of Expenses**: **${top.percentage.toFixed(1)}%**
- **Number of Transactions**: **${top.count}**

### Actionable Finding
${top.category} forms your primary outflow. Consider establishing a dedicated smart budget limit for ${top.category} to keep it under 30% of total income.`;
  }

  if (p.includes('last month') || p.includes('compare')) {
    const delta = summary.monthOverMonth.expenseChangePercent;
    return `### Month-over-Month Spending Comparison

- **Current Month Expenses**: **${formatCurrency(summary.monthlyExpense, currency)}**
- **Previous Month Expenses**: **${formatCurrency(summary.monthOverMonth.previousMonthExpense, currency)}**
- **Expense Variance**: **${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%**

${
  delta <= 0
    ? `🎉 Excellent job! You reduced your total monthly outflows by ${Math.abs(delta).toFixed(1)}%.`
    : `⚠️ Notice: Monthly expenses increased by ${delta.toFixed(1)}%. Review discretionary spending in Shopping and Entertainment.`
}`;
  }

  if (p.includes('save') || p.includes('plan')) {
    const suggestedSavings = summary.monthlyIncome * 0.2;
    return `### Personalized Savings Plan (50/30/20 Rule)

Based on your current monthly income of **${formatCurrency(summary.monthlyIncome, currency)}**:

1. **Needs (50%)**: Up to **${formatCurrency(summary.monthlyIncome * 0.5, currency)}** (Rent, Groceries, Utilities)
2. **Wants (30%)**: Up to **${formatCurrency(summary.monthlyIncome * 0.3, currency)}** (Dining, Shopping, Entertainment)
3. **Savings & Investments (20%)**: Target **${formatCurrency(suggestedSavings, currency)}/month**

Currently, your actual monthly savings stand at **${formatCurrency(summary.netSavings, currency)}** (${summary.savingsRate.toFixed(1)}% savings rate).`;
  }

  return `### SpendWise Financial Summary Diagnostics

- **Total Balance**: **${formatCurrency(summary.totalBalance, currency)}**
- **Current Month Income**: **${formatCurrency(summary.monthlyIncome, currency)}**
- **Current Month Expense**: **${formatCurrency(summary.monthlyExpense, currency)}**
- **Net Savings**: **${formatCurrency(summary.netSavings, currency)}**
- **Savings Rate**: **${summary.savingsRate.toFixed(1)}%**

*Tip: Connect your Gemini API key in the environment or AI Studio Secrets panel for conversational financial forecasting.*`;
}
