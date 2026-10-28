import zlib
import base64
import json

# Serverless Image Processing Pipeline - Architecture Diagram
# Using draw.io XML format

xml = '''<mxGraphModel dx="1422" dy="739" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2336" pageHeight="1654" background="#ffffff" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="Client/User" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="140" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="3" value="API Gateway" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="240" y="40" width="140" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="4" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;defaultLabelBackgroundColor=page;" edge="1" parent="1" source="2" target="3">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="5" value="Source Bucket" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="440" y="40" width="140" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="6" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;defaultLabelBackgroundColor=page;" edge="1" parent="1" source="3" target="5">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="7" value="SQS Queue" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="640" y="40" width="140" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="8" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;defaultLabelBackgroundColor=page;" edge="1" parent="1" source="5" target="7">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="9" value="Lambda" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="840" y="40" width="140" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="10" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;defaultLabelBackgroundColor=page;" edge="1" parent="1" source="7" target="9">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="11" value="Destination Bucket" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="1040" y="40" width="140" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="12" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;defaultLabelBackgroundColor=page;" edge="1" parent="1" source="9" target="11">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="13" value="CloudFront" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="1240" y="40" width="140" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="14" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;defaultLabelBackgroundColor=page;" edge="1" parent="1" source="11" target="13">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="15" value="User" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="1440" y="40" width="140" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="16" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;defaultLabelBackgroundColor=page;" edge="1" parent="1" source="13" target="15">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="17" value="DynamoDB" style="shape=cylinder3;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="840" y="140" width="140" height="80" as="geometry"/>
    </mxCell>
    <mxCell id="18" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;defaultLabelBackgroundColor=page;" edge="1" parent="1" source="9" target="17">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="19" value="SNS" style="ellipse;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="840" y="260" width="140" height="80" as="geometry"/>
    </mxCell>
    <mxCell id="20" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;defaultLabelBackgroundColor=page;" edge="1" parent="1" source="9" target="19">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="21" value="Step Functions" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="840" y="380" width="140" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="22" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;defaultLabelBackgroundColor=page;" edge="1" parent="1" source="9" target="21">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>'''

# Compress and encode the diagram
compressed = zlib.compress(xml.encode('utf-8'))
encoded = base64.urlsafe_b64encode(compressed).decode('utf-8')
url = f'https://viewer.diagrams.net/#R{encoded}'

# Create HTML with clickable link
html = f'''<!DOCTYPE html>
<html>
<head>
    <title>Serverless Image Processing Pipeline</title>
    <style>
        body {{ font-family: Arial, sans-serif; padding: 20px; }}
        .button {{
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-size: 16px;
        }}
        .button:hover {{ background-color: #0056b3; }}
        .container {{ max-width: 800px; margin: 0 auto; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Serverless Image Processing Pipeline Architecture</h1>
        <p>Click the button below to view and edit the architecture diagram in draw.io:</p>
        <a href="{url}" class="button" target="_blank">Open in draw.io</a>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
            URL: <a href="{url}" target="_blank">{url}</a>
        </p>
    </div>
</body>
</html>'''

print(html)
