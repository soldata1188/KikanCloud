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

    const { data: { user } } = await supabase.auth.getUser()

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
