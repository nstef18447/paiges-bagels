import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: pricing, error } = await supabase
      .from('pricing')
      .select('*')
      .order('bagel_quantity', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pricing', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Update each pricing entry
    const promises = updates.map(({ bagel_quantity, price }) =>
      supabase
        .from('pricing')
        .update({ price })
        .eq('bagel_quantity', bagel_quantity)
    );

    const results = await Promise.all(promises);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error('Errors updating pricing:', errors);
      return NextResponse.json(
        { error: 'Failed to update some pricing entries' },
        { status: 500 }
      );
    }

    // Fetch updated pricing
    const { data: updatedPricing } = await supabase
      .from('pricing')
      .select('*')
      .order('bagel_quantity', { ascending: true });

    return NextResponse.json(updatedPricing);
  } catch (error) {
    console.error('Error updating pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
