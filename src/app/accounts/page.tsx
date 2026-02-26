import { redirect } from 'next/navigation'

// /accounts đã được hợp nhất vào /settings?tab=organization
// Redirect vĩnh viễn để không còn page dư thừa
export default function AccountsRedirect() {
    redirect('/settings?tab=organization')
}
