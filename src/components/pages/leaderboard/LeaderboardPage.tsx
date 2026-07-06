"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useStore";

interface LBEntry {
  rank: number; userId: string; name: string; college: string;
  returns: number; portfolioValue: number; trades: number;
  ghostMode: boolean; xp: number; level: number;
}

const TABS = ["Global", "Weekly", "Monthly", "Friends"];
const AVATAR_COLORS = ["#00FF88","#3b82f6","#ffd700","#ff6b35","#a855f7","#06b6d4","#f43f5e","#84cc16"];

export default function LeaderboardPage() {
  const { token, user } = useAuthStore();
  const [entries, setEntries] = useState<LBEntry[]>([]);
  const [myRank, setMyRank] = useState<LBEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  const [groups, setGroups] = useState<any[]>([]);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  
  const tabName = TABS[tab].toLowerCase();
  
  const authHeader: HeadersInit = token
  ? {
      Authorization: `Bearer ${token}`,
    }
  : {};
  const fetchLB = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
         `/api/leaderboard?type=${tabName}`,
        {
           headers: authHeader,
        }
      );
      const json = await res.json();
      if (json.success) { setEntries(json.data.leaderboard); setMyRank(json.data.myRank); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [token, tabName]);

  const fetchGroups = useCallback(async () => {
  try {
    const res = await fetch("/api/groups", {
      headers: authHeader,
    });

    const json = await res.json();

    if (json.success) {
      setGroups(json.data);
    }
   } catch {}
  }, [token]);

  const createGroup = async () => {
  if (!groupName.trim()) return;

  try {
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: groupName,
      }),
    });

    const json = await res.json();

    if (json.success) {
      setGroupName("");
      fetchGroups();
    }
  } catch (err) {
    console.error(err);
  }
};
const joinGroup = async () => {
  if (!joinCode.trim()) return;

  try {
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: joinCode,
      }),
    });

    const json = await res.json();

    if (json.success) {
      setJoinCode("");
      fetchGroups();
    }
  } catch (err) {
    console.error(err);
  }
};

    useEffect(() => {
   fetchLB();
  
    if (tabName === "friends") {
    fetchGroups();
     }
  }, [fetchLB, fetchGroups, tabName]);

  function initials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  const top3 = entries.slice(0, 3);
  const rest  = entries.slice(3);

  return (
    <div className="page-enter px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-head text-xl font-bold" style={{ fontFamily: "Syne,sans-serif", color: "var(--text)" }}>Leaderboard</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>Top traders competing globally</p>
        </div>
        {myRank && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(0,255,136,0.1)", color: "var(--accent)", fontFamily: "Space Mono,monospace" }}>
            YOUR RANK: #{myRank.rank}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className="px-3.5 py-1.5 rounded-md text-xs font-medium border transition-all"
            style={{
              color: tab === i ? "var(--accent)" : "var(--text2)",
              background: tab === i ? "rgba(0,255,136,0.08)" : "transparent",
              borderColor: tab === i ? "rgba(0,255,136,0.2)" : "transparent",
            }}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm" style={{ color: "var(--text3)" }}>Loading leaderboard...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🏆</div>
          <div className="text-sm" style={{ color: "var(--text2)" }}>Be the first trader on the leaderboard!</div>
        </div>
      ) : tabName === "friends" ? (
        <div className="space-y-4">

        <div className="rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Create Group</h2>

         <div className="flex gap-2">
           <input
             value={groupName}
             onChange={(e) => setGroupName(e.target.value)}
             placeholder="Group name"
             className="flex-1 rounded border px-3 py-2 bg-transparent"
           />

           <button
             onClick={createGroup}
             className="px-4 py-2 rounded bg-green-500 text-black"
           >
             Create
           </button>
         </div>
       </div>

       <div className="rounded-xl border p-4">
         <h2 className="font-semibold mb-3">Join Group</h2>

         <div className="flex gap-2">
           <input
             value={joinCode}
             onChange={(e) => setJoinCode(e.target.value)}
             placeholder="Invite code"
             className="flex-1 rounded border px-3 py-2 bg-transparent"
           />

           <button
             onClick={joinGroup}
             className="px-4 py-2 rounded bg-green-500 text-black"
           >
             Join
          </button>
         </div>
       </div>

       <div className="rounded-xl border p-4">
         <h2 className="font-semibold mb-3">Your Groups</h2>

         {groups.length === 0 ? (
           <p>No groups yet.</p>
         ) : (
           groups.map((group: any) => (
           <div
               key={group._id}
               className="flex justify-between items-center py-3 border-b"
             >
               <div>
                 <div>{group.name}</div>
                 <div className="text-xs opacity-60">
                   {group.inviteCode}
                 </div>
               </div>

               <button
                 onClick={() => window.location.href = `/groups/${group._id}`}
                 className="px-3 py-1 border rounded"
               >
                 Open
               </button>
             </div>
           ))
         )}
       </div>

</div>


) : (

<>
          {/* Rest of leaderboard */}
          <div className="rounded-[10px] border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="grid px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.5px] border-b"
              style={{ gridTemplateColumns: "44px 1fr 1fr 1fr 80px", color: "var(--text3)", borderColor: "var(--border)", background: "var(--bg2)" }}>
              <div>Rank</div><div>Trader</div><div className="text-right">Returns</div>
              <div className="text-right">Portfolio</div><div className="text-right">Trades</div>
            </div>
            {rest.map((entry, i) => {
              const isMe = entry.userId === user?._id;
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid px-3.5 py-2.5 items-center border-b last:border-b-0"
                  style={{
                    gridTemplateColumns: "44px 1fr 1fr 1fr 80px",
                    borderColor: "rgba(255,255,255,0.03)",
                    background: isMe ? "rgba(0,255,136,0.04)" : "transparent",
                    borderLeft: isMe ? "2px solid var(--accent)" : "2px solid transparent",
                  }}
                >
                  <div className="text-xs font-bold font-mono" style={{ fontFamily: "Space Mono,monospace", color: isMe ? "var(--accent)" : "var(--text3)" }}>
                    #{entry.rank}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: `${color}20`, color, border: `1px solid ${color}33` }}>
                      {entry.ghostMode ? "👻" : initials(entry.name)}
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: isMe ? "var(--accent)" : "var(--text)", fontWeight: isMe ? 600 : 400 }}>{entry.name}</div>
                      <div className="text-[10px]" style={{ color: "var(--text3)" }}>{entry.college}</div>
                    </div>
                  </div>
                  <div className="text-right text-xs font-bold font-mono" style={{ fontFamily: "Space Mono,monospace", color: entry.returns >= 0 ? "var(--accent)" : "var(--red)" }}>
                    {entry.returns >= 0 ? "+" : ""}{entry.returns.toFixed(1)}%
                  </div>
                  <div className="text-right text-xs font-mono" style={{ fontFamily: "Space Mono,monospace", color: "var(--text)" }}>
                    ₹{(entry.portfolioValue / 100000).toFixed(1)}L
                  </div>
                  <div className="text-right text-xs" style={{ color: "var(--text2)" }}>{entry.trades}</div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
