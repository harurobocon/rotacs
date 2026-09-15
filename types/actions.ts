export interface ActionResult {
  errors?: string;
  success?: string;
  createdUsers?: Array<{
    username: string;
    display_name: string;
    password: string;
    pit_side: string;
    pit_number: number;
  }>;
}
