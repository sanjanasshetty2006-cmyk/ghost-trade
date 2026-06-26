"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/useStore";

export default function GroupLeaderboardPage() {
  const params = useParams();
  const id = params.id as string;

  const { token } = useAuthStore();

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/groups/${id}/leaderboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        if (json.success) {
          setGroup(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (id && token) {
      load();
    }
  }, [id, token]);

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-6">
        Group not found.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">
        {group.group.name}
      </h1>

      <p className="text-sm opacity-70 mb-6">
        Invite Code: <strong>{group.group.code}</strong>
      </p>

      <div className="space-y-3">
        {group.leaderboard.map((member: any) => (
          <div
            key={member.userId}
            className="flex justify-between items-center rounded-lg border p-4"
          >
            <div>
              <div className="font-semibold">
                #{member.rank} {member.name}
              </div>

              <div className="text-sm opacity-70">
                {member.college}
              </div>
            </div>

            <div className="text-right">
              <div className="font-bold">
                {member.returns.toFixed(2)}%
              </div>

              <div className="text-sm opacity-70">
                ₹{member.portfolioValue.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}