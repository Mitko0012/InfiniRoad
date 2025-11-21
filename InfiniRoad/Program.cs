using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello World!");


var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".glsl"] = "text/plain"; 
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider
});


app.Run();
