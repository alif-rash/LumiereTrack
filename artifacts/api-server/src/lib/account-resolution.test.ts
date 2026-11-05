import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { query, resolveClerkAccount } from "./lumiere";

test("verified sign-in recovers the existing workspace without changing ownership",async()=>{
  const original=`account-test-${randomUUID()}`;
  const replacement=`account-test-${randomUUID()}`;
  const concurrent=`account-test-${randomUUID()}`;
  const email=`${original}@example.test`;
  const courseId=randomUUID();
  try {
    await query("INSERT INTO lt_users(id,name,email,role,profile) VALUES($1,'Preserved professor',$2,'professor',$3)",[original,email,{university:"Preserved institution"}]);
    await query("INSERT INTO lt_courses(id,title,code,owner_id) VALUES($1,'Preserved course',$2,$3)",[courseId,randomUUID(),original]);
    const identity={id:replacement,email:email.toUpperCase(),name:"New sign-in name",emailVerified:true};
    await assert.rejects(()=>resolveClerkAccount(query,{...identity,emailVerified:false}),/verify your email/i);
    const account=await resolveClerkAccount(query,identity);
    assert.equal(account.id,original);
    assert.equal(account.role,"professor");
    assert.equal(account.name,"Preserved professor");
    assert.equal(account.profile.university,"Preserved institution");
    assert.equal((await query("SELECT owner_id FROM lt_courses WHERE id=$1",[courseId])).rows[0]!.owner_id,original);
    assert.equal((await query("SELECT count(*)::int AS n FROM lt_users WHERE lower(email)=$1",[email])).rows[0]!.n,1);
    const fresh={id:concurrent,email:`${concurrent}@example.test`,name:"Concurrent first sign-in",emailVerified:true};
    const users=await Promise.all(Array.from({length:5},()=>resolveClerkAccount(query,fresh)));
    assert.ok(users.every(u=>u.id===concurrent));
    assert.equal(users[0]!.role,"unassigned");
  } finally {
    await query("DELETE FROM lt_courses WHERE id=$1",[courseId]);
    await query("DELETE FROM lt_users WHERE id=ANY($1::text[])",[[original,replacement,concurrent]]);
    await pool.end();
  }
});
