import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Service Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // List files in uploads bucket root
  console.log("\n📁 Root of 'uploads' bucket:");
  const { data: root, error: rootErr } = await supabase.storage
    .from("uploads")
    .list("", { limit: 100 });
  
  if (rootErr) {
    console.error("Root error:", rootErr);
  } else {
    root?.forEach((f) => console.log(`  - ${f.name}`));
  }
  
  // List files in covers folder
  console.log("\n📁 Files in 'covers' folder:");
  const { data: covers, error: coversErr } = await supabase.storage
    .from("uploads")
    .list("covers", { limit: 100 });
  
  if (coversErr) {
    console.error("Covers error:", coversErr);
  } else {
    covers?.forEach((f) => console.log(`  - covers/${f.name}`));
  }
  
  // List files in pdfs folder
  console.log("\n📁 Files in 'pdfs' folder:");
  const { data: pdfs, error: pdfsErr } = await supabase.storage
    .from("uploads")
    .list("pdfs", { limit: 100 });
  
  if (pdfsErr) {
    console.error("PDFs error:", pdfsErr);
  } else {
    pdfs?.forEach((f) => console.log(`  - pdfs/${f.name}`));
  }
}

main().catch(console.error);
