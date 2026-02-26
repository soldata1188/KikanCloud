import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // EMERGENCY FIX: If already on login page, don't do anything to prevent loop
    if (request.nextUrl.pathname.startsWith('/login')) {
        return response;
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Handle invalid / expired refresh token → sign out and redirect to login
    if (authError && (
        authError.message?.includes('Refresh Token Not Found') ||
        authError.message?.includes('Invalid Refresh Token') ||
        (authError as any).code === 'refresh_token_not_found'
    )) {
        await supabase.auth.signOut()
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        loginUrl.searchParams.set('error', 'セッションが期限切れです。再度ログインしてください。')
        const redirectResponse = NextResponse.redirect(loginUrl)
        // Clear stale Supabase auth cookies
        request.cookies.getAll().forEach((cookie) => {
            if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
                redirectResponse.cookies.delete(cookie.name)
            }
        })
        return redirectResponse
    }

    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(userAgent);

    // Protect desktop-only complex operational routes
    const DESKTOP_ONLY_ROUTES = [
        '/workers',
        '/operations',
        '/companies',
        '/audits',
        '/procedures',
        '/routing',
        '/roadmap',
        '/workflows',
        '/portal/workers',
        '/accounts'
    ];

    const isDesktopOnly = DESKTOP_ONLY_ROUTES.some(route => request.nextUrl.pathname.startsWith(route));
    if (user && isMobile && isDesktopOnly) {
        const url = request.nextUrl.clone();
        url.pathname = '/desktop-only';
        return NextResponse.redirect(url);
    }

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
