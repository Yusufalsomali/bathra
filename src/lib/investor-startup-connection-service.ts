import { supabase, InvestorStartupConnection } from "./supabase";
import { NotificationService } from "./notification-service";

export interface CreateConnectionData {
  investor_id: string;
  startup_id: string;
  connection_type: "interested" | "info_request" | "saved";
  investor_name: string;
  investor_email: string;
  investor_calendly_link?: string;
  startup_name: string;
  startup_email: string;
  message?: string; // For info requests
}

export interface ConnectionFilters {
  investor_id?: string;
  startup_id?: string;
  connection_type?: "interested" | "info_request" | "saved";
  status?: "active" | "archived";
}

export class InvestorStartupConnectionService {
  // Create a new connection between investor and startup
  static async createConnection(
    data: CreateConnectionData
  ): Promise<{ data: InvestorStartupConnection | null; error: string | null }> {
    try {
      // Check if connection already exists
      const existingConnection = await this.getConnection(
        data.investor_id,
        data.startup_id,
        data.connection_type
      );

      if (existingConnection.data) {
        return {
          data: null,
          error: "Connection already exists",
        };
      }

      // Create the connection
      const { data: connection, error } = await supabase
        .from("investor_startup_connections")
        .insert({
          ...data,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating connection:", error);
        return {
          data: null,
          error: "Failed to create connection",
        };
      }

      // Send notifications based on connection type
      if (data.connection_type === "interested") {
        // Notify startup about investor interest
        await this.notifyStartupOfInterest(connection);
        // Notify admin team
        await this.notifyAdminOfConnection(connection);
      } else if (data.connection_type === "info_request") {
        // Only notify admin team for info requests
        await this.notifyAdminOfInfoRequest(connection);
      }

      return {
        data: connection,
        error: null,
      };
    } catch (error) {
      console.error("Error creating connection:", error);
      return {
        data: null,
        error: "Failed to create connection",
      };
    }
  }

  // Get a specific connection
  static async getConnection(
    investor_id: string,
    startup_id: string,
    connection_type: "interested" | "info_request" | "saved"
  ): Promise<{ data: InvestorStartupConnection | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("investor_startup_connections")
        .select("*")
        .eq("investor_id", investor_id)
        .eq("startup_id", startup_id)
        .eq("connection_type", connection_type)
        .eq("status", "active")
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error("Error fetching connection:", error);
        return {
          data: null,
          error: "Failed to fetch connection",
        };
      }

      return {
        data: data || null,
        error: null,
      };
    } catch (error) {
      console.error("Error fetching connection:", error);
      return {
        data: null,
        error: "Failed to fetch connection",
      };
    }
  }

  // Get connections with filters
  static async getConnections(
    filters?: ConnectionFilters
  ): Promise<{ data: InvestorStartupConnection[]; error: string | null }> {
    try {
      let query = supabase
        .from("investor_startup_connections")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.investor_id) {
        query = query.eq("investor_id", filters.investor_id);
      }

      if (filters?.startup_id) {
        query = query.eq("startup_id", filters.startup_id);
      }

      if (filters?.connection_type) {
        query = query.eq("connection_type", filters.connection_type);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      } else {
        query = query.eq("status", "active");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching connections:", error);
        return {
          data: [],
          error: "Failed to fetch connections",
        };
      }

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      console.error("Error fetching connections:", error);
      return {
        data: [],
        error: "Failed to fetch connections",
      };
    }
  }

  // Check if investor has already shown interest in a startup
  static async hasShownInterest(
    investor_id: string,
    startup_id: string
  ): Promise<boolean> {
    const result = await this.getConnection(
      investor_id,
      startup_id,
      "interested"
    );
    return result.data !== null;
  }

  // Archive a connection
  static async archiveConnection(
    connectionId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from("investor_startup_connections")
        .update({
          status: "archived",
          updated_at: new Date().toISOString(),
        })
        .eq("id", connectionId);

      if (error) {
        console.error("Error archiving connection:", error);
        return {
          success: false,
          error: "Failed to archive connection",
        };
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error("Error archiving connection:", error);
      return {
        success: false,
        error: "Failed to archive connection",
      };
    }
  }

  // Private method to notify startup of investor interest
  private static async notifyStartupOfInterest(
    connection: InvestorStartupConnection
  ): Promise<void> {
    try {
      const calendlyInfo = connection.investor_calendly_link
        ? `\n\nConnect with ${connection.investor_name}: ${connection.investor_calendly_link}`
        : "";

      await NotificationService.createNotification({
        user_id: connection.startup_id,
        type: "investment_interest",
        title: "New Investor Interest!",
        content: `${connection.investor_name} has shown interest in your startup "${connection.startup_name}".${calendlyInfo}`,
        priority: "high",
        metadata: {
          investor_id: connection.investor_id,
          investor_name: connection.investor_name,
          investor_email: connection.investor_email,
          investor_calendly_link: connection.investor_calendly_link,
          connection_id: connection.id,
        },
      });
    } catch (error) {
      console.error("Error notifying startup of interest:", error);
    }
  }

  // Private method to notify admin of new connection
  private static async notifyAdminOfConnection(
    connection: InvestorStartupConnection
  ): Promise<void> {
    try {
      // Get all admin users
      const { data: admins } = await supabase.from("admins").select("id");

      if (admins && admins.length > 0) {
        const adminIds = admins.map((admin) => admin.id);

        await NotificationService.sendBulkNotifications({
          user_ids: adminIds,
          type: "investment_interest",
          title: "New Investor Interest",
          content: `${connection.investor_name} has shown interest in "${connection.startup_name}"`,
          priority: "normal",
          metadata: {
            connection_id: connection.id,
            investor_id: connection.investor_id,
            startup_id: connection.startup_id,
            connection_type: connection.connection_type,
          },
        });
      }
    } catch (error) {
      console.error("Error notifying admin of connection:", error);
    }
  }

  // Private method to notify admin of info request (only visible to admin)
  private static async notifyAdminOfInfoRequest(
    connection: InvestorStartupConnection
  ): Promise<void> {
    try {
      // Get all admin users
      const { data: admins } = await supabase.from("admins").select("id");

      if (admins && admins.length > 0) {
        const adminIds = admins.map((admin) => admin.id);

        const messageContent = connection.message
          ? `\n\nMessage: "${connection.message}"`
          : "";

        await NotificationService.sendBulkNotifications({
          user_ids: adminIds,
          type: "admin_action",
          title: "Info Request from Investor",
          content: `${connection.investor_name} has requested more information about "${connection.startup_name}"${messageContent}`,
          priority: "normal",
          metadata: {
            connection_id: connection.id,
            investor_id: connection.investor_id,
            startup_id: connection.startup_id,
            connection_type: connection.connection_type,
            message: connection.message,
          },
        });
      }
    } catch (error) {
      console.error("Error notifying admin of info request:", error);
    }
  }

  static async toggleSaved(
    investorId: string,
    startupId: string,
    investorName: string,
    investorEmail: string,
    startupName: string,
    startupEmail: string
  ): Promise<{ saved: boolean; error: string | null }> {
    const existing = await this.getConnection(investorId, startupId, "saved");
    if (existing.data) {
      const { error } = await supabase
        .from("investor_startup_connections")
        .update({ status: "archived" })
        .eq("id", existing.data.id);
      return { saved: false, error: error?.message ?? null };
    }
    const { error } = await this.createConnection({
      investor_id: investorId,
      startup_id: startupId,
      connection_type: "saved",
      investor_name: investorName,
      investor_email: investorEmail,
      startup_name: startupName,
      startup_email: startupEmail,
    });
    return { saved: true, error };
  }

  static async getSavedStartupIds(investorId: string): Promise<string[]> {
    const { data } = await supabase
      .from("investor_startup_connections")
      .select("startup_id")
      .eq("investor_id", investorId)
      .eq("connection_type", "saved")
      .eq("status", "active");
    return (data ?? []).map((r) => r.startup_id);
  }
}
