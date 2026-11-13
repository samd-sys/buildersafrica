
import { createClient } from "npm:@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Missing Supabase environment variables.");

      return jsonResponse(
        { error: "Server configuration is incomplete." },
        500,
      );
    }

    // Authenticate the requesting user.
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Authentication required." },
        401,
      );
    }

    const accessToken = authorization
      .replace("Bearer ", "")
      .trim();

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(accessToken);

    if (userError || !user) {
      return jsonResponse(
        { error: "Invalid or expired session." },
        401,
      );
    }

    // Administrative client: server-side only.
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // 1. Retrieve files uploaded by this user.
    const { data: storageObjects, error: storageLookupError } =
      await adminClient.rpc("get_user_storage_objects", {
        target_user_id: user.id,
      });

    if (storageLookupError) {
      console.error(
        "Storage lookup failed:",
        storageLookupError,
      );

      return jsonResponse(
        { error: "Could not identify your account files." },
        500,
      );
    }

    // 2. Clean up application data transactionally.
    const { error: cleanupError } = await adminClient.rpc(
      "delete_user_account_data",
      { target_user_id: user.id },
    );

    if (cleanupError) {
      console.error(
        "Account data cleanup failed:",
        cleanupError,
      );

      return jsonResponse(
        { error: "Could not safely remove account data." },
        500,
      );
    }

    // 3. Group storage paths by their approved bucket.
    const filesByBucket = new Map<string, string[]>();

    for (const object of storageObjects ?? []) {
      const bucket = object.bucket_id;
      const path = object.object_name;

      if (
        !["avatars", "messages"].includes(bucket) ||
        !path ||
        path === ".emptyFolderPlaceholder"
      ) {
        continue;
      }

      const paths = filesByBucket.get(bucket) ?? [];
      paths.push(path);
      filesByBucket.set(bucket, paths);
    }

    // 4. Remove only files owned by the departing user.
    for (const [bucket, paths] of filesByBucket) {
      // Process in small batches.
      for (let i = 0; i < paths.length; i += 100) {
        const batch = paths.slice(i, i + 100);

        const { error: removalError } = await adminClient.storage
          .from(bucket)
          .remove(batch);

        if (removalError) {
          console.error(
            `Storage removal failed for ${bucket}:`,
            removalError,
          );

          return jsonResponse(
            {
              error:
                "Your account data was cleaned up, but some uploaded files could not be removed. Please try again.",
            },
            500,
          );
        }
      }
    }

    // 5. Delete the Auth account only after cleanup succeeds.
    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error(
        "Auth account deletion failed:",
        deleteError,
      );

      return jsonResponse(
        {
          error:
            "Your account data and files were cleaned up, but your Auth account could not be deleted. Please try again.",
        },
        500,
      );
    }

    return jsonResponse({
      success: true,
      message: "Your account has been permanently deleted.",
    });
  } catch (error) {
    console.error("Unexpected account deletion error:", error);

    return jsonResponse(
      {
        error:
          "An unexpected error occurred while deleting your account.",
      },
      500,
    );
  }
});
