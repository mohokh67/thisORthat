# Link is the only access control

thisORthat has no accounts, no board ownership, and no membership: a board's
unguessable link is the entire access mechanism, and anyone holding it has full
read and write access. Row-level security is left enabled but with fully permissive
policies for the anonymous role, and the anonymous API key is shipped in the static
bundle (which is unavoidable for a serverless static site and acceptable because the
key grants nothing the link doesn't already).

We chose this because the product is a lightweight, throwaway tool for
retrospectives where participants are already trusted, and the cost of building auth,
sharing flows, and permission UI is not worth paying. The accepted consequences:
anyone with a link can scrape, vandalise, or delete an entire board; a leaked link
cannot be revoked; and there is no server-side guard against scripted abuse beyond
column-level length and value constraints. If abuse ever becomes real, the permissive
RLS policies are the seam where access rules would be tightened.
