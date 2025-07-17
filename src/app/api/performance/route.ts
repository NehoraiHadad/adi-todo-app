import { NextRequest, NextResponse } from 'next/server';
import { performanceUtils } from '@/utils/supabase/performance-monitor';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * GET /api/performance
 * Returns performance statistics and monitoring data (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and check admin role
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get('timeRange') || '300000'); // Default 5 minutes
    const reportType = searchParams.get('type') || 'stats'; // 'stats' or 'report'

    let data;
    
    switch (reportType) {
      case 'stats':
        data = performanceUtils.getStats(timeRange);
        break;
      
      case 'report':
        data = performanceUtils.getReport(timeRange);
        break;
      
      case 'alerts':
        data = performanceUtils.getAlerts(timeRange);
        break;
      
      case 'health':
        data = await performanceUtils.healthCheck();
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
      timeRange,
      reportType,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error in GET /api/performance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch performance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/performance/alerts/clear
 * Clears performance alerts (admin only)
 */
export async function POST(_request: NextRequest) {
  try {
    // Authenticate and check admin role
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Clear alerts
    performanceUtils.clearAlerts();

    return NextResponse.json({
      success: true,
      message: 'Performance alerts cleared successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/performance/alerts/clear:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear performance alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}