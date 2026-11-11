import { StudentShell } from '@/components/student-shell'
import { RedeemForm } from '@/components/redeem-form'
import { sensitiveFeaturesEnabled } from '@/lib/feature-gates'
export default function RedeemPage() { return <StudentShell title="Redeem your code" path="/redeem"><RedeemForm enabled={sensitiveFeaturesEnabled()} /></StudentShell> }
