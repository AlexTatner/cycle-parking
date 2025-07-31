import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  try {
    const searchParams = request.nextUrl.searchParams;
    const bounds = searchParams.get('bounds');

    const query = `
      SELECT 
        feature_id, 
        borough, 
        prk_cpt, 
        photo1_url, 
        prk_cover,
        prk_secure,
        prk_locker,
        prk_hangar,
        svdate,
        ST_AsGeoJSON(location) as location
      FROM cycle_parking
    `;

    let result;

    if (bounds) {
      const [swLng, swLat, neLng, neLat] = bounds.split(',').map(parseFloat);
      result = await client.query(
        `${query} WHERE location && ST_MakeEnvelope($1, $2, $3, $4, 4326) LIMIT 2000`,
        [swLng, swLat, neLng, neLat]
      );
    } else {
      // Default behavior if no bounds are provided
      result = await client.query(`${query} LIMIT 100`);
    }

    const features = result.rows.map(row => {
      const location = JSON.parse(row.location);
      return {
        type: 'Feature',
        geometry: location,
        properties: {
          featureId: row.feature_id,
          borough: row.borough,
          capacity: row.prk_cpt,
          photoUrl: row.photo1_url,
          covered: row.prk_cover,
          secure: row.prk_secure,
          locker: row.prk_locker,
          hangar: row.prk_hangar,
          lastSurveyed: row.svdate,
        },
      };
    });

    return NextResponse.json({
      type: 'FeatureCollection',
      features: features,
    });
  } catch (error) {
    console.error('Error fetching parking data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}
