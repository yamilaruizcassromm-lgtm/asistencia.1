import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class SupabaseService {

    private static final String SUPABASE_URL = "TUS_SUPABASE_URL_AQUÍ";
    private static final String SUPABASE_ANON_KEY = "TUS_SUPABASE_ANON_KEY_AQUÍ";
    private static final HttpClient httpClient = HttpClient.newHttpClient();

    public static void obtenerAlumnos() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(SUPABASE_URL + "/rest/v1/alumnos?select=*"))
                    .header("apikey", SUPABASE_ANON_KEY)
                    .header("Authorization", "Bearer " + SUPABASE_ANON_KEY)
                    .header("Content-Type", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                System.out.println("Alumnos obtenidos desde Java: " + response.body());
            } else {
                System.err.println("Error: " + response.statusCode() + " - " + response.body());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        obtenerAlumnos();
    }
}