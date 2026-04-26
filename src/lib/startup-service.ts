import { supabase } from "./supabase";
import { Startup } from "./supabase";
import {
  StartupBasicInfo,
  AdminStartupInfo,
  StartupFilters,
  PaginatedStartups,
} from "./startup-types";

export class StartupService {
  // Convert database Startup to our simplified StartupBasicInfo for regular users
  private static transformStartup(startup: Startup): StartupBasicInfo {
    return {
      id: startup.id.toString(),
      email: startup.email,
      name: startup.name,
      startup_name: startup.startup_name || startup.name,
      industry: startup.industry,
      stage: startup.stage || "Unknown",
      description: startup.problem_solving,
      website: startup.website,
      founders: startup.founder_info,
      team_size: startup.team_size,
      founded_date: startup.created_at,
      target_market: startup.problem_solving,
      problem_solved: startup.problem_solving,
      usp: startup.uniqueness,
      traction: startup.achievements,
      key_metrics: startup.achievements,
      funding_required: startup.capital_seeking?.toString(),
      valuation: startup.pre_money_valuation?.toString(),
      funding_goal: startup.capital_seeking,
      valuation_amount: startup.pre_money_valuation,
      already_raised_amount: startup.funding_already_raised,
      verified: startup.verified,
      image: startup.logo,
      logo: startup.logo,
    };
  }

  // Convert database Startup to AdminStartupInfo with all fields for admin views
  private static transformStartupForAdmin(startup: Startup): AdminStartupInfo {
    return {
      // Include all basic info
      ...StartupService.transformStartup(startup),

      // Add admin-specific fields
      email: startup.email,
      phone: startup.phone,
      founder_info: startup.founder_info,
      problem_solving: startup.problem_solving,
      solution: startup.solution,
      uniqueness: startup.uniqueness,

      // Financial details
      previous_financial_year_revenue: startup.previous_financial_year_revenue,
      monthly_burn_rate: startup.monthly_burn_rate,
      capital_seeking: startup.capital_seeking,
      pre_money_valuation: startup.pre_money_valuation,
      funding_already_raised: startup.funding_already_raised,
      previous_funding: startup.funding_already_raised?.toString(),
      investment_instrument: startup.investment_instrument,
      has_received_funding: startup.has_received_funding,

      // Additional details
      use_of_funds: startup.capital_seeking?.toString(),
      roadmap: startup.achievements,
      exit_strategy: startup.exit_strategy,
      achievements: startup.achievements,
      risks: startup.risks,
      risk_mitigation: startup.risk_mitigation,
      participated_in_accelerator: startup.participated_in_accelerator,
      pitch_deck: startup.pitch_deck,
      calendly_link: startup.calendly_link,
      video_link: startup.video_link,

      // Status and admin fields
      status: startup.status,
      created_at: startup.created_at,
      business_model: "SaaS", // Default as this field doesn't exist in DB
      contact_email: startup.email,
      investment_terms: startup.investment_instrument,
      financials: startup.previous_financial_year_revenue?.toString(),
      market_analysis: startup.problem_solving,
      competition: startup.risks,
      video_url: startup.video_link,
      document_path: startup.pitch_deck,
      admin_notes: startup.admin_notes,
      verified_at: startup.verified_at,
      verified_by: startup.verified_by,
      visibility_status: startup.visibility_status,
      updated_at: startup.updated_at,
      additional_files: startup.additional_files
        ? typeof startup.additional_files === "string"
          ? JSON.parse(startup.additional_files)
          : startup.additional_files
        : [],
    };
  }

  // Fetch all approved/vetted startups
  static async getVettedStartups(filters?: StartupFilters): Promise<{
    data: PaginatedStartups | StartupBasicInfo[];
    error: string | null;
  }> {
    try {
      // If no pagination parameters are provided, return all results (for backward compatibility)
      if (!filters?.limit && !filters?.offset) {
        let query = supabase
          .from("startups")
          .select("*")
          .eq("status", "approved")
          .eq("verified", true)
          .order("created_at", { ascending: false });

        // Apply filters
        if (filters?.industry) {
          query = query.ilike("industry", `%${filters.industry}%`);
        }

        if (filters?.stage) {
          query = query.eq("stage", filters.stage);
        }

        if (filters?.searchTerm) {
          query = query.or(
            `startup_name.ilike.%${filters.searchTerm}%,name.ilike.%${filters.searchTerm}%,industry.ilike.%${filters.searchTerm}%,problem_solving.ilike.%${filters.searchTerm}%`
          );
        }

        const { data, error } = await query;

        if (error) {
          return { data: [], error: error.message };
        }

        const transformedData = (data || []).map((startup) =>
          StartupService.transformStartup(startup)
        );
        return { data: transformedData, error: null };
      }

      // Paginated request
      const page = Math.max(
        1,
        Math.floor((filters?.offset || 0) / (filters?.limit || 10)) + 1
      );
      const limit = Math.min(50, Math.max(1, filters?.limit || 12));
      const offset = (page - 1) * limit;

      let query = supabase
        .from("startups")
        .select("*", { count: "exact" })
        .eq("status", "approved")
        .eq("verified", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters?.industry) {
        query = query.ilike("industry", `%${filters.industry}%`);
      }

      if (filters?.stage) {
        query = query.eq("stage", filters.stage);
      }

      if (filters?.searchTerm) {
        query = query.or(
          `startup_name.ilike.%${filters.searchTerm}%,name.ilike.%${filters.searchTerm}%,industry.ilike.%${filters.searchTerm}%,problem_solving.ilike.%${filters.searchTerm}%`
        );
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: [], error: error.message };
      }

      const transformedData = (data || []).map((startup) =>
        StartupService.transformStartup(startup)
      );

      const totalPages = Math.ceil((count || 0) / limit);

      const paginatedResult: PaginatedStartups = {
        startups: transformedData,
        total: count || 0,
        page,
        limit,
        totalPages,
      };

      return { data: paginatedResult, error: null };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Fetch startups for dashboard (limited number)
  static async getDashboardStartups(limit: number = 6): Promise<{
    data: StartupBasicInfo[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .eq("status", "approved")
        .eq("verified", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        return { data: [], error: error.message };
      }

      const transformedData = (data || []).map((startup) =>
        StartupService.transformStartup(startup)
      );
      return { data: transformedData, error: null };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Get startup by ID
  static async getStartupById(id: string): Promise<{
    data: StartupBasicInfo | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      const transformedData = data
        ? StartupService.transformStartup(data)
        : null;
      return { data: transformedData, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Get multiple startups by IDs
  static async getStartupsByIds(ids: string[]): Promise<{
    data: StartupBasicInfo[];
    error: string | null;
  }> {
    try {
      if (ids.length === 0) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .in("id", ids)
        .eq("status", "approved")
        .eq("verified", true);

      if (error) {
        return { data: [], error: error.message };
      }

      const transformedData = (data || []).map((startup) =>
        StartupService.transformStartup(startup)
      );
      return { data: transformedData, error: null };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Get unique industries for filter options
  static async getIndustries(): Promise<{
    data: string[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("startups")
        .select("industry")
        .eq("status", "approved")
        .eq("verified", true);

      if (error) {
        return { data: [], error: error.message };
      }

      const industries = [
        ...new Set((data || []).map((item) => item.industry).filter(Boolean)),
      ];
      return { data: industries, error: null };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Get unique stages for filter options
  static async getStages(): Promise<{
    data: string[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("startups")
        .select("stage")
        .eq("status", "approved")
        .eq("verified", true);

      if (error) {
        return { data: [], error: error.message };
      }

      const stages = [
        ...new Set((data || []).map((item) => item.stage).filter(Boolean)),
      ];
      return { data: stages, error: null };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Fetch ALL startups for admin use (not just verified/approved)
  static async getAllStartups(filters?: StartupFilters): Promise<{
    data: PaginatedStartups<AdminStartupInfo> | AdminStartupInfo[];
    error: string | null;
  }> {
    try {
      // If no pagination parameters are provided, return all results (for backward compatibility)
      if (!filters?.limit && !filters?.offset) {
        let query = supabase
          .from("startups")
          .select("*")
          .order("created_at", { ascending: false });

        // Apply filters
        if (filters?.industry) {
          query = query.ilike("industry", `%${filters.industry}%`);
        }

        if (filters?.stage) {
          query = query.eq("stage", filters.stage);
        }

        if (filters?.searchTerm) {
          query = query.or(
            `startup_name.ilike.%${filters.searchTerm}%,name.ilike.%${filters.searchTerm}%,industry.ilike.%${filters.searchTerm}%,problem_solving.ilike.%${filters.searchTerm}%`
          );
        }

        const { data, error } = await query;

        if (error) {
          return { data: [], error: error.message };
        }

        const transformedData = (data || []).map((startup) =>
          StartupService.transformStartupForAdmin(startup)
        );
        return { data: transformedData, error: null };
      }

      // Paginated request
      const page = Math.max(
        1,
        Math.floor((filters?.offset || 0) / (filters?.limit || 10)) + 1
      );
      const limit = Math.min(50, Math.max(1, filters?.limit || 12));
      const offset = (page - 1) * limit;

      let query = supabase
        .from("startups")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters?.industry) {
        query = query.ilike("industry", `%${filters.industry}%`);
      }

      if (filters?.stage) {
        query = query.eq("stage", filters.stage);
      }

      if (filters?.searchTerm) {
        query = query.or(
          `startup_name.ilike.%${filters.searchTerm}%,name.ilike.%${filters.searchTerm}%,industry.ilike.%${filters.searchTerm}%,problem_solving.ilike.%${filters.searchTerm}%`
        );
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: [], error: error.message };
      }

      const transformedData = (data || []).map((startup) =>
        StartupService.transformStartupForAdmin(startup)
      );

      const totalPages = Math.ceil((count || 0) / limit);

      const paginatedResult: PaginatedStartups<AdminStartupInfo> = {
        startups: transformedData,
        total: count || 0,
        page,
        limit,
        totalPages,
      };

      return { data: paginatedResult, error: null };
    } catch (error) {
      return {
        data: [],
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
