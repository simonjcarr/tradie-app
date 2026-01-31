"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JobsPage() {
  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Manage your work</p>
        </div>
        <Button className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" />
          New Job
        </Button>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No jobs yet</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Create your first job to start tracking work for your customers.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create First Job
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
