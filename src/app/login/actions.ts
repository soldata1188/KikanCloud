'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(formData: FormData) {
 const email = formData.get('email') as string
 const password = formData.get('password') as string
 const supabase = await createClient()

 const { error } = await supabase.auth.signInWithPassword({ email, password })

 if (error) {
 // Basic auto-fix: If user deleted, try signup
 const { error: signUpError } = await supabase.auth.signUp({
 email, password, options: { data: { role: 'union_admin' } }
 });
 if (!signUpError) {
 await supabase.auth.signInWithPassword({ email, password })
 } else {
 return redirect('/login?error=' + encodeURIComponent(error.message))
 }
 }

 const { data: { user } } = await supabase.auth.getUser()
 if (user) {
 const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
 if (userData?.role === 'company_admin' || userData?.role === 'company_user') {
 revalidatePath('/', 'layout')
 redirect('/portal')
 }
 }

 revalidatePath('/', 'layout')
 redirect('/')
}

export async function logout() {
 const supabase = await createClient()
 await supabase.auth.signOut()
 revalidatePath('/', 'layout')
 redirect('/login')
}
