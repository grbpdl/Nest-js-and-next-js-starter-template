import type { AuthUser } from "@/lib/types";
import { isAdmin, isSuperAdmin } from "@/lib/auth";

export function ProfileCard({ user }: { user: AuthUser }) {
  const roleNames = user.roles?.map((r) => r.name) ?? [];
  const showPermissions = isAdmin(user) || isSuperAdmin(user);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-zinc-900">Profile</h1>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-zinc-500">Name</dt>
          <dd className="font-medium text-zinc-900">
            {user.firstName} {user.lastName}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Email</dt>
          <dd className="font-medium text-zinc-900">{user.email}</dd>
        </div>
        {user.phone ? (
          <div>
            <dt className="text-zinc-500">Phone</dt>
            <dd className="font-medium text-zinc-900">{user.phone}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-zinc-500">Roles</dt>
          <dd className="mt-1 flex flex-wrap gap-2">
            {roleNames.length === 0 ? (
              <span className="text-zinc-700">None</span>
            ) : (
              roleNames.map((name) => (
                <span
                  key={name}
                  className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-800"
                >
                  {name}
                </span>
              ))
            )}
          </dd>
        </div>
        {showPermissions ? (
          <div>
            <dt className="text-zinc-500">Permissions</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {(user.permissions ?? []).length === 0 ? (
                <span className="text-zinc-700">None assigned</span>
              ) : (
                (user.permissions ?? []).map((code) => (
                  <span
                    key={code}
                    className="rounded border border-zinc-200 px-2 py-0.5 font-mono text-xs text-zinc-800"
                  >
                    {code}
                  </span>
                ))
              )}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
