"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RedemptionsPolicyStepProps {
  // Props will be added later when we implement the detailed forms
}

export function RedemptionsPolicyStep({}: RedemptionsPolicyStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Redemptions</h2>
        <p className="text-muted-foreground">Configure redemption policies for your vault</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Redemption Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Redemption policy configuration will be implemented here.
            This will include settings for allowed redemption assets, minimum balances, and redemption restrictions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
