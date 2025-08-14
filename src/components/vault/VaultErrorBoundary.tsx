"use client";

import React from "react";
import { VaultTile } from "@/components/vault/VaultTile";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class VaultErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Vault data loading error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
          <VaultTile title="Error" description="Failed to load vault data" />
          <VaultTile title="Reason" description="API rate limit or network error" />
          <VaultTile title="Solution" description="Please refresh the page in a few seconds" />
          <VaultTile title="Status" description="Error Boundary Active" />
          <VaultTile title="Retry" description="Page refresh recommended" />
          <VaultTile title="Note" description="Data loading has been stopped to prevent spam" />
        </div>
      );
    }

    return this.props.children;
  }
}
