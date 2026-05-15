import mysql.connector
import requests
import time

def main():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="Visva@1216",
            database="delhi_grievance"
        )
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id, latitude, longitude, district FROM complaints WHERE district IS NULL OR district = '' OR district = 'Unknown'")
        rows = cursor.fetchall()
        print(f"Found {len(rows)} complaints needing location update.")
        
        updated_count = 0
        
        for row in rows:
            if not row['latitude'] or not row['longitude']:
                continue
                
            lat, lon = row['latitude'], row['longitude']
            url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
            
            try:
                headers = {'User-Agent': 'DelhiGrievancePortal/1.0 (local test dev script)'}
                response = requests.get(url, headers=headers)
                data = response.json()
                
                if data and 'address' in data:
                    addr = data['address']
                    district = addr.get('state_district') or addr.get('city_district') or addr.get('district') or addr.get('county') or addr.get('suburb') or addr.get('city') or addr.get('town') or 'Unknown Delhi Area'
                    full_address = data.get('display_name', '')
                    ward = addr.get('neighbourhood') or addr.get('suburb') or addr.get('village') or ''
                    pincode = addr.get('postcode') or ''
                    
                    update_q = "UPDATE complaints SET district = %s, address = %s, ward = %s, pincode = %s WHERE id = %s"
                    cursor.execute(update_q, (district, full_address, ward, pincode, row['id']))
                    conn.commit()
                    updated_count += 1
                    print(f"Updated Complaint ID {row['id']} to District: {district}")
                time.sleep(1) # rate limit
            except Exception as e:
                print(f"Error for ID {row['id']}: {e}")
                
        print(f"Done. Successfully updated {updated_count} complaints.")
        
    except Exception as e:
        print(f"DB Error: {e}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    main()
