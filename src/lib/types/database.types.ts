/**
 * Hand-written to match supabase/migrations/{0001_init,0002_tk77_credit_gated_booking}.sql.
 * Regenerate the authoritative version once you have a real project linked, with:
 *   npm run supabase:types
 *
 * Every table also declares Insert/Update/Relationships (even where unused)
 * and the schema declares an empty Views map - @supabase/postgrest-js's
 * GenericSchema requires that exact shape to resolve query results to real
 * types; leaving any of it out silently degrades every `.from()`/`.rpc()`
 * call in the app to `never`/`undefined` instead of a type error you'd
 * actually notice.
 */

export type OrderStatus = 'new' | 'confirmed' | 'rejected' | 'expired' | 'canceled' | 'paid' | 'closed';
export type ConfirmationMode = 'none' | 'manual';
export type CreditTransactionType = 'topup' | 'booking' | 'refund' | 'adjustment';
export type PaymentMethod = 'bank_transfer' | 'cash';
export type CreditTransactionStatus = 'pending' | 'confirmed';

export interface Season {
  from: string; // 'DD.MM'
  to: string; // 'DD.MM'
}

// availability[seasonIndex][dayName][minute] = price in EUR
export type DayAvailability = Record<string, number>;
export type CourtAvailability = Record<string, DayAvailability>[];

export interface Database {
  public: {
    Views: {
      // Public occupancy-only slice of `orders` (0004_public_court_availability_view.sql) -
      // deliberately excludes user_id/price/booking_reference/etc. See its
      // migration comment for why `orders` itself can't be queried directly
      // for this from a regular (RLS-scoped) client.
      court_booked_slots: {
        Row: {
          court_id: number;
          order_date: string;
          from_minute: number;
          to_minute: number;
        };
        Relationships: [];
      };
    };
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          birthday: string | null;
          country: string | null;
          nationality: string | null;
          image_path: string | null;
          is_admin: boolean;
          credit_balance: number;
          created_at: string;
          updated_at: string;
        };
        // Always inserted by the _handle_new_auth_user() trigger, never by
        // application code - see 0001_init.sql.
        Insert: never;
        Update: Partial<{
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          birthday: string | null;
          country: string | null;
          nationality: string | null;
          image_path: string | null;
        }>;
        Relationships: [];
      };
      club_settings: {
        Row: {
          id: number;
          name: string | null;
          contact: string | null;
          address: string | null;
          street: string | null;
          town: string | null;
          postal: string | null;
          country: string;
          lat: number | null;
          lon: number | null;
          email: string | null;
          phone: string | null;
          web: string | null;
          description: string | null;
          seasons: Season[];
          images: string[];
          sms_notification: boolean;
          sms_notification_time: boolean;
          sms_from: string | null;
          sms_to: string | null;
          confirmation: ConfirmationMode;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        // No app-level writes - only the service role writes this row directly (see 0001_init.sql).
        Insert: never;
        Update: never;
        Relationships: [];
      };
      courts: {
        Row: {
          id: number;
          name: string;
          active: boolean;
          type: string | null;
          surface: string | null;
          availability: CourtAvailability;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        // No app-level writes - only the service role writes this row directly (see 0001_init.sql).
        Insert: never;
        Update: never;
        Relationships: [];
      };
      orders: {
        Row: {
          id: number;
          user_id: string;
          court_id: number;
          from_minute: number;
          to_minute: number;
          order_date: string;
          status: OrderStatus;
          price: number;
          currency: string;
          booking_reference: string;
          confirmation: ConfirmationMode;
          // Present in the DB and typed here for accuracy, but not
          // selectable by `authenticated` - only a service-role client can
          // actually read it (see 0001_init.sql's column GRANTs).
          token: string;
          sms_gw_response: Record<string, string> | null;
          created_at: string;
          updated_at: string;
        };
        // The only writes are create_order()/club_decide_order()/cancel_order()/expire_stale_orders().
        Insert: never;
        Update: never;
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: number;
          user_id: string;
          amount: number;
          type: CreditTransactionType;
          payment_method: PaymentMethod | null;
          status: CreditTransactionStatus;
          variable_symbol: string | null;
          user_claimed_paid_at: string | null;
          order_id: number | null;
          created_by: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        // The only writes go through the SECURITY DEFINER functions below.
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      create_order: {
        Args: { p_court_id: number; p_order_date: string; p_from_minute: number; p_to_minute: number };
        Returns: Database['public']['Tables']['orders']['Row'];
      };
      club_decide_order: {
        Args: { p_order_id: number; p_approve: boolean; p_token?: string | null; p_sms_gw_response?: Record<string, string> | null };
        Returns: Database['public']['Tables']['orders']['Row'];
      };
      expire_stale_orders: {
        Args: { p_older_than_minutes: number };
        Returns: number;
      };
      request_topup: {
        Args: { p_amount: number };
        Returns: Database['public']['Tables']['credit_transactions']['Row'];
      };
      mark_topup_paid: {
        Args: { p_transaction_id: number };
        Returns: void;
      };
      confirm_topup: {
        Args: { p_transaction_id: number };
        Returns: Database['public']['Tables']['credit_transactions']['Row'];
      };
      grant_cash_credit: {
        Args: { p_user_id: string; p_amount: number; p_note: string };
        Returns: Database['public']['Tables']['credit_transactions']['Row'];
      };
      cancel_order: {
        Args: { p_order_id: number };
        Returns: Database['public']['Tables']['orders']['Row'];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
}
