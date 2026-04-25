export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      arxiv_categories: {
        Row: {
          code: string;
          created_at: string;
          description: string;
          display_name: string;
          embedding: string | null;
          id: string;
          updated_at: string;
        };
      };
      extension_installations: {
        Row: {
          browser_name: string;
          created_at: string;
          id: string;
          paired_token: string;
          profile_id: string | null;
          updated_at: string;
          workspace_id: string | null;
        };
      };
      extension_pairings: {
        Row: {
          code: string;
          created_at: string;
          expires_at: string;
          id: string;
          profile_id: string;
          updated_at: string;
          used_at: string | null;
          workspace_id: string;
        };
      };
      paper_versions: {
        Row: {
          created_at: string;
          extracted_structure_json: Json | null;
          id: string;
          paper_id: string;
          parse_artifact_path: string | null;
          parse_error: string | null;
          parse_status: string;
          parser_engine: string | null;
          source_file_name: string | null;
          source_kind: string;
          source_path: string | null;
          updated_at: string;
        };
      };
      papers: {
        Row: {
          created_at: string;
          first_time_submitter: boolean;
          id: string;
          intended_category: string | null;
          owner_user_id: string | null;
          paper_type: string;
          title: string;
          updated_at: string;
          workspace_id: string | null;
        };
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          onboarding_state: string;
          updated_at: string;
        };
      };
	      review_checks: {
	        Row: {
	          anchor_id: string | null;
	          created_at: string;
	          detail: string;
	          evidence_json: Json;
	          id: string;
	          linked_suggestion_ids_json: Json;
	          name: string;
	          review_file_id: string | null;
	          review_id: string;
	          rule_id: string;
	          rule_version: string;
	          severity: string;
	          source_checked_at: string;
	          source_url: string;
	          state: string;
	          summary: string;
	        };
      };
      review_comments: {
        Row: {
          anchor_id: string;
          body: string;
          created_at: string;
          file_path: string;
          id: string;
          linked_suggestion_ids_json: Json;
          review_file_id: string;
          review_id: string;
          rule_id: string;
          rule_version: string;
          severity: string;
          source_url: string | null;
          target: string;
          updated_at: string;
        };
      };
      review_events: {
        Row: {
          created_at: string;
          detail: string | null;
          event_kind: string;
          file_path: string | null;
          id: string;
          label: string;
          review_id: string;
          suggestion_id: string | null;
        };
      };
      review_files: {
        Row: {
          base_text: string;
          change_count: number;
          created_at: string;
          current_text: string;
          diff_stats_json: Json;
          id: string;
          path: string;
          review_id: string;
          severity: string;
          suggestion_ids_json: Json;
          status: string;
          title: string;
          updated_at: string;
        };
      };
      review_suggestions: {
        Row: {
          anchor_json: Json | null;
          applied_at: string | null;
          created_at: string;
          diff_stats_json: Json;
          edited_text: string | null;
          explainability_json: Json | null;
          file_path: string;
          id: string;
          linked_check_ids_json: Json;
          linked_comment_ids_json: Json;
          origin: string;
          original_text: string;
          rationale: string;
          resolved_at: string | null;
          review_file_id: string | null;
          review_id: string;
          severity: string;
          status: string;
          suggested_text: string;
          title: string;
          updated_at: string;
        };
      };
      reviews: {
        Row: {
          ai_presence_summary_json: Json | null;
          context_json: Json | null;
          created_at: string;
          engine_version: string | null;
          failed_reason: string | null;
          id: string;
          paper_id: string;
          paper_version_id: string;
          readiness: string | null;
          status: "queued" | "processing" | "ready" | "failed";
          summary_json: Json | null;
          updated_at: string;
        };
      };
      usage_events: {
        Row: {
          created_at: string;
          event_name: string;
          event_payload: Json | null;
          id: string;
          workspace_id: string | null;
        };
      };
      workspace_members: {
        Row: {
          created_at: string;
          role: string;
          user_id: string;
          workspace_id: string;
        };
      };
      workspaces: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          owner_user_id: string | null;
          updated_at: string;
        };
      };
    };
  };
};
