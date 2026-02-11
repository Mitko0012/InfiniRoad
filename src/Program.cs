using Microsoft.AspNetCore.StaticFiles;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".glsl"] = "text/plain";
provider.Mappings[".obj"] = "text/plain";
var defaultFileOptions = new DefaultFilesOptions();
defaultFileOptions.DefaultFileNames.Clear();
defaultFileOptions.DefaultFileNames.Add("index.html");
app.UseDefaultFiles(defaultFileOptions); 
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider
});


app.Run();
