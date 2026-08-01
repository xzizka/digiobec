import { useState } from 'react'
import { SubmissionList } from '../features/submissions/components/SubmissionList'
import { SubmissionForm } from '../features/submissions/components/SubmissionForm'

export function SubmissionsPage() {
  const [selectedTrackingCode, setSelectedTrackingCode] = useState<string | null>(
    null,
  )

  if (selectedTrackingCode) {
    return (
      <div className="p-4">
        <SubmissionForm
          trackingCode={selectedTrackingCode}
          onBack={() => setSelectedTrackingCode(null)}
        />
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="mb-4">Podání</h1>
      <SubmissionList onSelect={(s) => setSelectedTrackingCode(s.trackingCode)} />
    </div>
  )
}
