const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Find the start of the grid containing the two tables
const startStr = '<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">';
const startIndex = content.indexOf(startStr);

if (startIndex === -1) {
    console.log("Could not find start index");
    process.exit(1);
}

// Find the closing </div> of that grid.
// Fortunately, we know this is the last element before closing the wrapper tags.
// By looking at lines 301-306, it ends with:
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }
// Let's just do a manual slice up to the startStr, and append the rest.

const beforeContent = content.substring(0, startIndex);
const endSnippet = `          </div>
        </main>
      </div>
    </div>
  )
}
`;

fs.writeFileSync('src/app/page.tsx', beforeContent + endSnippet, 'utf8');
console.log("Removed the tables block successfully.");
