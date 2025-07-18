# Use nginx to serve static files
FROM nginx:alpine

# Copy game file to nginx html directory (everything is now in index.html)
COPY index.html /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 