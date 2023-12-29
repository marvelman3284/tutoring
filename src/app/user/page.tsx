"use client";
import React from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Link } from "@nextui-org/react"

export default function ProfileClient() {
  const { user, error, isLoading } = useUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) return <div>{error.message}</div>;

  return (
    <>
      {user && (
        <div>
          <img src={user.picture || ""} alt={user.name || ""} />
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      )}
      {!user && (
        <div>
          <h1>You're not logged in!</h1>
          <Link href="/login" showAnchorIcon> Login Here!</Link>
        </div>
      )}
    </>
  );
}
