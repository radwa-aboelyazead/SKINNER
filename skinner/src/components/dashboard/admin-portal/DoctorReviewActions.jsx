import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DoctorReviewActions({ doctorName = "this doctor", onApprove, onReject, busy }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);

  const handleTriggerAction = (type) => {
    setActionType(type);
    setDialogOpen(true);
  };

  const isApprove = actionType === "approve";
  const handleConfirm = async () => {
    if (isApprove) await onApprove?.();
    else await onReject?.();
    setDialogOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          size="lg"
          disabled={busy}
          onClick={() => handleTriggerAction("approve")}
          className="bg-green-600 hover:bg-green-700 text-white flex gap-2 disabled:opacity-60"
        >
          <CheckCircle2 className="h-4 w-4" /> Approve & Activate Account
        </Button>

        <Button
          size="lg"
          disabled={busy}
          onClick={() => handleTriggerAction("reject")}
          className="bg-red-600 hover:bg-red-700 text-white flex gap-2 disabled:opacity-60"
        >
          <XCircle className="h-4 w-4" /> Reject Application
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className={`p-3 rounded-full mb-2 ${isApprove ? "bg-green-50" : "bg-red-50"}`}>
              {isApprove ? <CheckCircle2 className="h-8 w-8 text-green-600" /> : <AlertTriangle className="h-8 w-8 text-red-600" />}
            </div>
            <DialogTitle className="text-xl">{isApprove ? "Confirm Approval" : "Confirm Rejection"}</DialogTitle>
            <DialogDescription className="pt-2">
              {isApprove
                ? `Are you sure you want to approve ${doctorName}? This will activate their account.`
                : `Are you sure you want to reject ${doctorName}? This action will be logged.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 sm:justify-center mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancel</Button>
            <Button
              disabled={busy}
              onClick={handleConfirm}
              className={`flex-1 ${isApprove ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
            >
              {busy ? "Working..." : `Confirm ${isApprove ? "Approval" : "Rejection"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
