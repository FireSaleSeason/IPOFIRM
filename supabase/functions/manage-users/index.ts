import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the request is from an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're an admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.log("Failed to get user:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin using the has_role function
    const { data: isAdmin, error: roleError } = await userClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      console.log("User is not an admin:", roleError?.message);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...payload } = await req.json();
    console.log(`Processing action: ${action}`);

    switch (action) {
      case "list": {
        // List all users with their roles
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
        if (listError) {
          console.error("Error listing users:", listError.message);
          throw listError;
        }

        // Get roles for all users
        const { data: roles, error: rolesError } = await adminClient
          .from("user_roles")
          .select("user_id, role");

        if (rolesError) {
          console.error("Error fetching roles:", rolesError.message);
        }

        const rolesMap = new Map();
        roles?.forEach((r) => {
          if (!rolesMap.has(r.user_id)) {
            rolesMap.set(r.user_id, []);
          }
          rolesMap.get(r.user_id).push(r.role);
        });

        const usersWithRoles = users.map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          roles: rolesMap.get(u.id) || [],
        }));

        console.log(`Listed ${usersWithRoles.length} users`);
        return new Response(
          JSON.stringify({ users: usersWithRoles }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create": {
        const { email, password, role } = payload;
        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: "Email and password are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm email
        });

        if (createError) {
          console.error("Error creating user:", createError.message);
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Assign role if specified
        if (role && newUser.user) {
          const { error: roleError } = await adminClient
            .from("user_roles")
            .insert({ user_id: newUser.user.id, role });

          if (roleError) {
            console.error("Error assigning role:", roleError.message);
          }
        }

        console.log(`Created user: ${email} with role: ${role || "none"}`);
        return new Response(
          JSON.stringify({ user: newUser.user }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        const { userId } = payload;
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "User ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prevent self-deletion
        if (userId === user.id) {
          return new Response(
            JSON.stringify({ error: "Cannot delete your own account" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete user (roles will cascade delete due to FK)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
        if (deleteError) {
          console.error("Error deleting user:", deleteError.message);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Deleted user: ${userId}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update-role": {
        const { userId, role, roleAction } = payload;
        if (!userId || !role) {
          return new Response(
            JSON.stringify({ error: "User ID and role are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (roleAction === "add") {
          const { error: addError } = await adminClient
            .from("user_roles")
            .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

          if (addError) {
            console.error("Error adding role:", addError.message);
            return new Response(
              JSON.stringify({ error: addError.message }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else if (roleAction === "remove") {
          // Prevent removing own admin role
          if (userId === user.id && role === "admin") {
            return new Response(
              JSON.stringify({ error: "Cannot remove your own admin role" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const { error: removeError } = await adminClient
            .from("user_roles")
            .delete()
            .eq("user_id", userId)
            .eq("role", role);

          if (removeError) {
            console.error("Error removing role:", removeError.message);
            return new Response(
              JSON.stringify({ error: removeError.message }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        console.log(`Updated role for user ${userId}: ${roleAction} ${role}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in manage-users function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
